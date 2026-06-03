/**
 * Migrate local /uploads/* image URLs in MongoDB to Vercel Blob public URLs.
 *
 * Prerequisites:
 *   - MONGODB_URI in .env
 *   - BLOB_READ_WRITE_TOKEN in .env (Vercel Blob store connected)
 *   - Files still present under public/uploads/...
 *
 * Usage:
 *   node scripts/migrate-uploads-to-blob.js           # dry-run (no writes)
 *   node scripts/migrate-uploads-to-blob.js --apply   # upload + update DB
 */

const fs = require("fs");
const dns = require("node:dns");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const { put } = require("@vercel/blob");

function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    });
}

function mimeFromExt(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

function isLocalUploadUrl(value) {
  return typeof value === "string" && value.startsWith("/uploads/");
}

function collectUploadUrls(value, found = new Set()) {
  if (typeof value === "string") {
    if (isLocalUploadUrl(value)) found.add(value);
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUploadUrls(item, found));
    return found;
  }
  if (value && typeof value === "object") {
    if (value instanceof Date || value instanceof ObjectId) return found;
    Object.values(value).forEach((v) => collectUploadUrls(v, found));
  }
  return found;
}

function replaceUploadUrls(value, urlMap) {
  if (typeof value === "string") {
    return urlMap.get(value) ?? value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceUploadUrls(item, urlMap));
  }
  if (value && typeof value === "object") {
    if (value instanceof Date || value instanceof ObjectId) return value;
    const next = {};
    for (const [key, v] of Object.entries(value)) {
      next[key] = replaceUploadUrls(v, urlMap);
    }
    return next;
  }
  return value;
}

function documentsDiffer(before, after) {
  return JSON.stringify(before) !== JSON.stringify(after);
}

function configureDnsFallback(mongoUri) {
  if (!mongoUri?.startsWith("mongodb+srv://")) return;

  const configured = process.env.MONGODB_DNS_SERVERS?.trim();
  const raw = configured || "8.8.8.8,1.1.1.1";
  const servers = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (servers.length === 0) return;

  try {
    dns.setServers(servers);
    console.log(`Using DNS fallback servers for SRV lookup: ${servers.join(", ")}`);
  } catch (err) {
    console.warn(`Could not configure DNS fallback servers (${raw}): ${err.message}`);
  }
}

async function uploadLocalFileToBlob(localUrl) {
  const diskPath = path.join(process.cwd(), "public", localUrl.replace(/^\//, ""));
  if (!fs.existsSync(diskPath)) {
    throw new Error(`File not found: ${diskPath}`);
  }
  const blobPath = localUrl.replace(/^\/uploads\//, "");
  const buffer = fs.readFileSync(diskPath);
  const blob = await put(blobPath, buffer, {
    access: "public",
    contentType: mimeFromExt(diskPath),
    addRandomSuffix: false,
  });
  return blob.url;
}

async function main() {
  loadEnv();
  const apply = process.argv.includes("--apply");
  const mongoUri = process.env.MONGODB_URI;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

  if (!mongoUri) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }
  if (!blobToken) {
    console.error("BLOB_READ_WRITE_TOKEN is not set. Connect Vercel Blob to this project first.");
    process.exit(1);
  }

  configureDnsFallback(mongoUri);
  const client = new MongoClient(mongoUri);
  const urlMap = new Map();
  const stats = {
    collectionsScanned: 0,
    documentsUpdated: 0,
    urlsFound: 0,
    urlsUploaded: 0,
    urlsSkipped: 0,
    urlsFailed: 0,
    missingFiles: 0,
  };
  let privateStoreBlocked = false;

  try {
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();

    console.log(apply ? "APPLY mode — uploading and updating DB\n" : "DRY-RUN — no uploads or DB writes\n");

    const allUrls = new Set();
    const docsByCollection = [];

    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;
      const col = db.collection(name);
      const docs = await col.find({}).toArray();
      stats.collectionsScanned += 1;

      for (const doc of docs) {
        const urls = collectUploadUrls(doc);
        if (urls.size === 0) continue;
        urls.forEach((u) => allUrls.add(u));
        docsByCollection.push({ name, doc, urls: [...urls] });
      }
    }

    stats.urlsFound = allUrls.size;
    console.log(`Found ${allUrls.size} unique /uploads/ URL(s) across ${docsByCollection.length} document(s)\n`);

    for (const localUrl of allUrls) {
      const diskPath = path.join(process.cwd(), "public", localUrl.replace(/^\//, ""));
      if (!fs.existsSync(diskPath)) {
        console.warn(`  MISSING file: ${localUrl}`);
        stats.missingFiles += 1;
        stats.urlsFailed += 1;
        continue;
      }

      if (!apply) {
        console.log(`  would upload: ${localUrl}`);
        stats.urlsSkipped += 1;
        continue;
      }

      try {
        const blobUrl = await uploadLocalFileToBlob(localUrl);
        urlMap.set(localUrl, blobUrl);
        stats.urlsUploaded += 1;
        console.log(`  uploaded: ${localUrl}`);
        console.log(`       ->  ${blobUrl}`);
      } catch (err) {
        stats.urlsFailed += 1;
        const msg = err?.message ?? String(err);
        if (
          msg.includes("Cannot use public access on a private store") ||
          msg.includes("private store")
        ) {
          privateStoreBlocked = true;
          console.error(
            "  FAILED: Blob store is private but migration uploads require public access URLs."
          );
          console.error(
            "         Fix: switch this Blob store to Public access (or connect a public Blob store),"
          );
          console.error(
            "               update BLOB_READ_WRITE_TOKEN, then rerun migrate:uploads:apply."
          );
          break;
        }
        console.error(`  FAILED: ${localUrl} — ${msg}`);
      }
    }

    if (privateStoreBlocked) {
      process.exitCode = 1;
      return;
    }

    if (!apply) {
      console.log("\nDry-run complete. Run with --apply to migrate.");
      return;
    }

    if (urlMap.size === 0) {
      console.log("\nNo URLs uploaded; nothing to update in DB.");
      return;
    }

    console.log("\nUpdating MongoDB documents…\n");

    for (const { name, doc } of docsByCollection) {
      const updated = replaceUploadUrls(doc, urlMap);
      if (!documentsDiffer(doc, updated)) continue;

      const { _id, ...rest } = updated;
      await db.collection(name).replaceOne({ _id }, rest);
      stats.documentsUpdated += 1;
      console.log(`  updated ${name} / ${_id}`);
    }

    console.log("\nDone.");
    console.log(JSON.stringify(stats, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
