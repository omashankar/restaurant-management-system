/**
 * Seed Script — Super Admin
 * Run: node scripts/seed.js
 *
 * Safe to run multiple times — skips if super_admin already exists.
 */

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const path   = require("path");

// Load .env manually (no dotenv package needed in Node 20+)
require("fs")
  .readFileSync(path.resolve(__dirname, "../.env"), "utf8")
  .split("\n")
  .forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });

const MONGODB_URI         = process.env.MONGODB_URI;
const SUPER_ADMIN_EMAIL   = process.env.SUPER_ADMIN_EMAIL   ?? "superadmin@rms.com";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD ?? "SuperAdmin@2026";

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env");
  process.exit(1);
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔌  Connecting to MongoDB…");
    await client.connect();
    const db = client.db();
    console.log("✅  Connected to:", db.databaseName);

    /* ── Check if super_admin already exists ── */
    const existing = await db.collection("users").findOne({ role: "super_admin" });

    if (existing) {
      console.log("ℹ️   Super admin already exists:", existing.email);
      console.log("✅  Seed skipped — no duplicates created.");
      return;
    }

    /* ── Hash password ── */
    console.log("🔐  Hashing password…");
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

    /* ── Insert super admin ── */
    const result = await db.collection("users").insertOne({
      name:          "Super Admin",
      email:         SUPER_ADMIN_EMAIL.toLowerCase().trim(),
      password:      hashedPassword,
      role:          "super_admin",
      restaurantId:  null,
      isSystemUser:  true,
      isVerified:    true,
      status:        "active",
      createdAt:     new Date(),
    });

    console.log("✅  Super admin created!");
    console.log("   ID:    ", result.insertedId.toString());
    console.log("   Email: ", SUPER_ADMIN_EMAIL);
    console.log("   Role:  super_admin");
    console.log("\n⚠️   Change the password after first login!");

  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌  Connection closed.");
  }
}

seed();
