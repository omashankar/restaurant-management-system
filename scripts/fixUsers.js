/**
 * Fix Users Script
 * Run: node scripts/fixUsers.js
 *
 * Sets status="active" and isVerified=true on any user
 * that is missing those fields (created before the seed was corrected).
 * Safe to run multiple times.
 */

const { MongoClient } = require("mongodb");
const path = require("path");

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

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("❌  MONGODB_URI not set"); process.exit(1); }

async function fix() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log("✅  Connected to:", db.databaseName);

    /* Fix missing status */
    const statusResult = await db.collection("users").updateMany(
      { status: { $exists: false } },
      { $set: { status: "active" } }
    );
    console.log(`✅  Fixed status:     ${statusResult.modifiedCount} user(s)`);

    /* Fix missing isVerified */
    const verifiedResult = await db.collection("users").updateMany(
      { isVerified: { $exists: false } },
      { $set: { isVerified: true } }
    );
    console.log(`✅  Fixed isVerified: ${verifiedResult.modifiedCount} user(s)`);

    /* Show all users for confirmation */
    const users = await db.collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    console.log(`\n📋  All users (${users.length}):`);
    users.forEach((u) => {
      console.log(`   ${u.email.padEnd(35)} role=${u.role.padEnd(12)} status=${u.status}  isVerified=${u.isVerified}`);
    });

  } catch (err) {
    console.error("❌  Fix failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌  Done.");
  }
}

fix();
