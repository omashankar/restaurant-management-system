/**
 * Activate all inactive users and restaurants.
 * Run: node scripts/activateUsers.js
 */
const { MongoClient } = require("mongodb");
const path = require("path");

require("fs")
  .readFileSync(path.resolve(__dirname, "../.env"), "utf8")
  .split("\n")
  .forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const i = t.indexOf("=");
    if (i < 0) return;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log("✅  Connected to:", db.databaseName);

    // Activate all inactive users (except none — activate everyone)
    const users = await db.collection("users").updateMany(
      { status: { $in: ["inactive", "suspended", "blocked"] } },
      { $set: { status: "active" } }
    );
    console.log(`✅  Activated ${users.modifiedCount} user(s)`);

    // Activate all inactive restaurants
    const restaurants = await db.collection("restaurants").updateMany(
      { status: { $in: ["inactive", "suspended"] } },
      { $set: { status: "active" } }
    );
    console.log(`✅  Activated ${restaurants.modifiedCount} restaurant(s)`);

    // Show final state
    const allUsers = await db.collection("users")
      .find({}, { projection: { password: 0 } })
      .toArray();

    console.log(`\n📋  Users (${allUsers.length}):`);
    allUsers.forEach((u) => {
      const mark = u.status === "active" ? "✅" : "❌";
      console.log(`  ${mark}  ${u.email.padEnd(35)} role=${u.role.padEnd(12)} status=${u.status}`);
    });

  } catch (err) {
    console.error("❌  Error:", err.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌  Done.");
  }
}

run();
