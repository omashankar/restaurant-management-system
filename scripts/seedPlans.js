/**
 * Seed default subscription plans.
 * Run: node scripts/seedPlans.js
 * Safe to run multiple times — skips existing slugs.
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

const PLANS = [
  {
    name: "Free",
    slug: "free",
    price: 0,
    billingCycle: "monthly",
    description: "Perfect for getting started.",
    features: ["1 restaurant", "Up to 3 staff", "Basic POS", "Menu management"],
    limits: { staff: 3, tables: 5, menuItems: 20, orders: 100 },
    isActive: true,
  },
  {
    name: "Starter",
    slug: "starter",
    price: 29,
    billingCycle: "monthly",
    description: "For small restaurants growing fast.",
    features: ["1 restaurant", "Up to 10 staff", "Full POS", "Reservations", "Analytics"],
    limits: { staff: 10, tables: 20, menuItems: 100, orders: 1000 },
    isActive: true,
  },
  {
    name: "Pro",
    slug: "pro",
    price: 79,
    billingCycle: "monthly",
    description: "For established restaurants.",
    features: ["1 restaurant", "Unlimited staff", "Full POS", "Inventory", "Advanced analytics", "Priority support"],
    limits: { staff: -1, tables: -1, menuItems: -1, orders: -1 },
    isActive: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: 199,
    billingCycle: "monthly",
    description: "For restaurant chains and franchises.",
    features: ["Multiple locations", "Unlimited everything", "Custom integrations", "Dedicated support", "SLA guarantee"],
    limits: { staff: -1, tables: -1, menuItems: -1, orders: -1, locations: -1 },
    isActive: true,
  },
];

async function seedPlans() {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    console.log("✅  Connected to:", db.databaseName);

    let created = 0, skipped = 0;
    for (const plan of PLANS) {
      const existing = await db.collection("plans").findOne({ slug: plan.slug });
      if (existing) { console.log(`ℹ️   Skipped: ${plan.name} (already exists)`); skipped++; continue; }
      await db.collection("plans").insertOne({ ...plan, createdAt: new Date() });
      console.log(`✅  Created: ${plan.name} — $${plan.price}/mo`);
      created++;
    }

    console.log(`\n📊  Done — ${created} created, ${skipped} skipped.`);
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedPlans();
