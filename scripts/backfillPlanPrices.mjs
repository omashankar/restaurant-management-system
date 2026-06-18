/**
 * Backfill monthlyPrice / yearlyPrice on existing plans.
 * Run: node scripts/backfillPlanPrices.mjs
 */

import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  });
}

const DEFAULTS = {
  free: { monthly: 0, yearly: 0 },
  starter: { monthly: 29, yearly: 348 },
  pro: { monthly: 79, yearly: 948 },
  enterprise: { monthly: 199, yearly: 2388 },
};

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  const plans = await db.collection("plans").find({}).toArray();
  let updated = 0;

  for (const plan of plans) {
    const defaults = DEFAULTS[plan.slug];
    const hasMonthly = Number.isFinite(Number(plan.monthlyPrice));
    const hasYearly = Number.isFinite(Number(plan.yearlyPrice));
    if (hasMonthly && hasYearly) {
      console.log(`skip ${plan.slug} — already has dual prices`);
      continue;
    }

    const legacy = Number(plan.price ?? 0);
    const cycle = plan.billingCycle === "yearly" ? "yearly" : "monthly";
    let monthlyPrice = hasMonthly ? Number(plan.monthlyPrice) : null;
    let yearlyPrice = hasYearly ? Number(plan.yearlyPrice) : null;

    if (monthlyPrice == null) {
      monthlyPrice = defaults?.monthly ?? (cycle === "yearly" ? Number((legacy / 12).toFixed(2)) : legacy);
    }
    if (yearlyPrice == null) {
      yearlyPrice = defaults?.yearly ?? (cycle === "yearly" ? legacy : Number((legacy * 12).toFixed(2)));
    }

    await db.collection("plans").updateOne(
      { _id: plan._id },
      {
        $set: {
          monthlyPrice,
          yearlyPrice,
          price: cycle === "yearly" ? yearlyPrice : monthlyPrice,
          updatedAt: new Date(),
        },
      },
    );
    console.log(`updated ${plan.slug}: monthly=${monthlyPrice}, yearly=${yearlyPrice}`);
    updated++;
  }

  console.log(`\nDone — ${updated} plan(s) updated.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
