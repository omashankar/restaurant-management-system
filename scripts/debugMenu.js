/**
 * Run: node scripts/debugMenu.js
 * Checks MongoDB connection + menuItems collection directly.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI not found in .env.local");
  process.exit(1);
}

const { MongoClient } = await import("mongodb");
const client = new MongoClient(uri);

try {
  await client.connect();
  console.log("✅ MongoDB connected");

  const db = client.db();

  // Check collections
  const collections = await db.listCollections().toArray();
  console.log("📦 Collections:", collections.map((c) => c.name).join(", ") || "(none)");

  // Count menu items
  const total = await db.collection("menuItems").countDocuments();
  console.log(`🍽  menuItems total: ${total}`);

  if (total === 0) {
    console.warn("⚠️  No menu items in database. Add items via /menu/items first.");
  } else {
    const sample = await db.collection("menuItems").find().limit(3).toArray();
    console.log("📋 Sample items:");
    sample.forEach((i) => console.log(`   - ${i.name} | $${i.price} | status: ${i.status} | restaurantId: ${i.restaurantId}`));
  }

  // Check users (need at least one to log in)
  const userCount = await db.collection("users").countDocuments();
  console.log(`👤 users total: ${userCount}`);

  if (userCount === 0) {
    console.warn("⚠️  No users found. Run: node scripts/seed.js");
  }

} catch (err) {
  console.error("❌ Error:", err.message);
} finally {
  await client.close();
}
