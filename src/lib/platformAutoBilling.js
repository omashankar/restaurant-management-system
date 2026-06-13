import { platformEmailSubject } from "@/config/bhojdeskBrand";
import { getPlatformSettings } from "@/lib/platformSettings";
import { sendPlatformAlert } from "@/lib/platformAlerts";
import { getPlatformCurrency } from "@/lib/platformCurrency";

/**
 * When autoBilling is ON: mark expired subscriptions and notify admins.
 * @param {import("mongodb").Db} db
 */
export async function runPlatformAutoBilling(db) {
  const settings = await getPlatformSettings(db);
  if (!settings.advanced?.autoBilling) {
    return { skipped: true, reason: "disabled" };
  }

  const now = new Date();
  const currency = await getPlatformCurrency(db);
  const prefix = String(settings.advanced?.invoicePrefix ?? "INV-").trim() || "INV-";

  const expired = await db.collection("subscriptions").find({
    status: { $in: ["active", "trial"] },
    endDate: { $lt: now },
  }).toArray();

  let updated = 0;
  for (const sub of expired) {
    await db.collection("subscriptions").updateOne(
      { _id: sub._id },
      { $set: { status: "expired", updatedAt: now } },
    );
    if (sub.restaurantId) {
      await db.collection("restaurants").updateOne(
        { _id: sub.restaurantId },
        { $set: { subscriptionStatus: "expired", updatedAt: now } },
      );
    }
    updated += 1;
  }

  const soon = await db.collection("subscriptions").find({
    status: { $in: ["active", "trial"] },
    endDate: { $gte: now, $lte: new Date(now.getTime() + 3 * 86_400_000) },
  }).toArray();

  for (const sub of soon) {
    const restaurant = sub.restaurantId
      ? await db.collection("restaurants").findOne({ _id: sub.restaurantId })
      : null;
    const invoiceId = `${prefix}${Date.now()}-${sub._id.toString().slice(-6)}`;
    const exists = await db.collection("payments").findOne({
      restaurantId: sub.restaurantId,
      status: "pending",
      paymentType: "subscription_renewal",
      planSlug: sub.planSlug,
    });
    if (exists) continue;

    await db.collection("payments").insertOne({
      restaurantId: sub.restaurantId,
      restaurantName: restaurant?.name ?? "—",
      adminEmail: restaurant?.ownerEmail ?? "—",
      plan: sub.planSlug,
      planName: sub.planName,
      billingCycle: sub.billingCycle,
      paymentType: "subscription_renewal",
      amount: sub.price ?? 0,
      currency,
      status: "pending",
      invoiceId,
      method: "auto",
      notes: "Auto-generated renewal invoice",
      createdAt: now,
    });
  }

  if (updated > 0) {
    await sendPlatformAlert(db, "systemHealth", {
      subject: platformEmailSubject(`Auto-billing: ${updated} subscription(s) expired`),
      text: `${updated} subscription(s) were marked expired. ${soon.length} renewal invoice(s) pending.`,
    }).catch(() => {});
  }

  return { expired: updated, renewalInvoices: soon.length };
}
