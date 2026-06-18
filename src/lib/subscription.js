import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";
import {
  computeBillingEndDate,
  computeSubscriptionSchedule,
  parseDateInput,
  parseTrialDaysValue,
} from "./subscriptionSchedule";

export function extendByBillingCycle(baseDate, billingCycle) {
  return computeBillingEndDate(baseDate, billingCycle === "yearly" ? "yearly" : "monthly");
}

export function computeEndDate(startDate, billingCycle) {
  return computeBillingEndDate(startDate, billingCycle);
}

/** Effective status for display/enforcement. */
export function resolveSubscriptionStatus(sub, now = new Date()) {
  if (!sub) return "active";
  const status = sub.status ?? "active";
  if (status === "cancelled") return "cancelled";

  const endDate = sub.endDate ? new Date(sub.endDate) : null;
  if (endDate && endDate < now) return "expired";

  if (status === "trial") {
    const trialEnd = sub.trialEnd ? new Date(sub.trialEnd) : null;
    if (trialEnd && trialEnd < now) return "active";
    return "trial";
  }

  return status;
}

async function syncRestaurantStatuses(db, subs, status, now) {
  const restaurantIds = [...new Set(subs.map((s) => s.restaurantId).filter(Boolean))];
  if (!restaurantIds.length) return;
  await db.collection("restaurants").updateMany(
    { _id: { $in: restaurantIds } },
    { $set: { subscriptionStatus: status, updatedAt: now } },
  );
}

/** Sync all subscriptions in DB — expire stale, promote ended trials to active. */
export async function syncAllSubscriptionStatuses(db, now = new Date()) {
  const toExpire = await db.collection("subscriptions").find({
    endDate: { $lt: now },
    status: { $in: ["active", "trial"] },
  }).toArray();

  if (toExpire.length) {
    await db.collection("subscriptions").updateMany(
      { _id: { $in: toExpire.map((s) => s._id) } },
      { $set: { status: "expired", updatedAt: now } },
    );
    await syncRestaurantStatuses(db, toExpire, "expired", now);
  }

  const toActivate = await db.collection("subscriptions").find({
    status: "trial",
    trialEnd: { $lt: now, $ne: null },
    endDate: { $gte: now },
  }).toArray();

  if (toActivate.length) {
    await db.collection("subscriptions").updateMany(
      { _id: { $in: toActivate.map((s) => s._id) } },
      { $set: { status: "active", updatedAt: now } },
    );
    await syncRestaurantStatuses(db, toActivate, "active", now);
  }
}

export async function expireStaleSubscriptions(db, subs, now = new Date()) {
  const updates = (subs ?? [])
    .filter((s) => s.status !== "cancelled")
    .map((s) => ({
      _id: s._id,
      restaurantId: s.restaurantId,
      from: s.status,
      to: resolveSubscriptionStatus(s, now),
    }))
    .filter((u) => u.from !== u.to);

  if (!updates.length) return;

  for (const u of updates) {
    await db.collection("subscriptions").updateOne(
      { _id: u._id },
      { $set: { status: u.to, updatedAt: now } },
    );
  }

  const byStatus = updates.reduce((acc, u) => {
    (acc[u.to] ??= []).push(u);
    return acc;
  }, {});
  for (const [status, group] of Object.entries(byStatus)) {
    await syncRestaurantStatuses(db, group, status, now);
  }
}

export async function getSubscription(restaurantId) {
  const client = await clientPromise;
  const db     = client.db();
  const _rid   = typeof restaurantId === "string" ? new ObjectId(restaurantId) : restaurantId;

  const sub = await db.collection("subscriptions").findOne(
    { restaurantId: _rid },
    { sort: { createdAt: -1 } },
  );
  if (!sub) return null;

  const now = new Date();
  const effectiveStatus = resolveSubscriptionStatus(sub, now);

  if (effectiveStatus !== sub.status && sub.status !== "cancelled") {
    await db.collection("subscriptions").updateOne(
      { _id: sub._id },
      { $set: { status: effectiveStatus, updatedAt: now } },
    );
    await db.collection("restaurants").updateOne(
      { _id: sub.restaurantId },
      { $set: { subscriptionStatus: effectiveStatus, updatedAt: now } },
    );
    sub.status = effectiveStatus;
  }

  return {
    id:           sub._id.toString(),
    restaurantId: sub.restaurantId.toString(),
    planId:       sub.planId?.toString() ?? null,
    planSlug:     sub.planSlug    ?? "free",
    planName:     sub.planName    ?? "Free",
    limits:       sub.limits      ?? {},
    features:     sub.features    ?? [],
    price:        sub.price       ?? 0,
    billingCycle: sub.billingCycle ?? "monthly",
    startDate:    sub.startDate,
    endDate:      sub.endDate,
    trialEnd:     sub.trialEnd    ?? null,
    status:       effectiveStatus,
    daysLeft:     sub.endDate
      ? Math.max(0, Math.ceil((new Date(sub.endDate) - now) / 86_400_000))
      : null,
  };
}

export async function assignPlan(restaurantId, planSlug, options = {}) {
  const client = await clientPromise;
  const db     = client.db();
  const _rid   = typeof restaurantId === "string" ? new ObjectId(restaurantId) : restaurantId;

  const plan = await db.collection("plans").findOne({ slug: planSlug });
  if (!plan) throw new Error("Plan not found: " + planSlug);

  const billingCycle = options.billingCycle === "yearly" ? "yearly" : "monthly";
  const monthlyPrice = Number(plan.monthlyPrice ?? plan.price ?? 0);
  const yearlyPrice  = Number(plan.yearlyPrice ?? monthlyPrice * 12);
  const price        = billingCycle === "yearly" ? yearlyPrice : monthlyPrice;

  const now = new Date();
  const startDate = options.startDate ? parseDateInput(options.startDate) : now;

  let trialDays = options.trialDays;
  if (trialDays == null || trialDays === undefined) {
    const platformDoc = await db.collection("settings").findOne(
      { _id: "platform" },
      { projection: { "payment.trialDays": 1 } },
    );
    const platformTrial = Number(platformDoc?.payment?.trialDays);
    trialDays =
      Number.isFinite(plan.trialDays) && plan.trialDays > 0
        ? plan.trialDays
        : Number.isFinite(platformTrial) && platformTrial >= 0
          ? platformTrial
          : 0;
  } else {
    trialDays = parseTrialDaysValue(trialDays);
  }

  const schedule = computeSubscriptionSchedule({
    startDate,
    billingCycle,
    trialDays,
  });
  const trialEnd = schedule.trialEnd;
  const billingStart = schedule.billingStart;

  let endDate = schedule.endDate;
  if (options.endDate) {
    const provided = new Date(options.endDate);
    if (Number.isNaN(provided.getTime())) {
      throw new Error("Invalid end date.");
    }
    if (provided < billingStart) {
      throw new Error("End date must be after the trial period.");
    }
    endDate = provided;
  }

  const status = trialEnd && trialEnd > now ? "trial" : "active";

  const subDoc = {
    restaurantId:  _rid,
    planId:        plan._id,
    planSlug:      plan.slug,
    planName:      plan.name,
    limits:        plan.limits      ?? {},
    features:      plan.features    ?? [],
    price,
    billingCycle,
    startDate,
    endDate,
    trialEnd,
    status,
    updatedAt: now,
  };

  const result = await db.collection("subscriptions").findOneAndUpdate(
    { restaurantId: _rid },
    { $set: subDoc, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" },
  );

  await db.collection("restaurants").updateOne(
    { _id: _rid },
    {
      $set: {
        plan: plan.slug,
        subscriptionStatus: status,
        planAssignedAt: now,
        updatedAt: now,
      },
    },
  );

  return result;
}

export async function checkFeature(restaurantId, featureName) {
  const sub = await getSubscription(restaurantId);
  if (!sub)                       return { allowed: false, reason: "No active subscription." };
  if (sub.status === "expired")   return { allowed: false, reason: "Subscription expired." };
  if (sub.status === "cancelled") return { allowed: false, reason: "Subscription cancelled." };
  if (sub.planSlug === "free")    return { allowed: true };
  const allowed = sub.features.some((f) => f.toLowerCase().includes(featureName.toLowerCase()));
  return allowed
    ? { allowed: true }
    : { allowed: false, reason: "Feature not included in your plan." };
}

export function checkLimit(subscription, limitKey, currentCount) {
  if (!subscription)                    return { allowed: false, reason: "No active subscription." };
  if (subscription.status === "expired") return { allowed: false, reason: "Subscription expired." };
  const limit = subscription.limits?.[limitKey];
  if (limit == null || limit === -1)    return { allowed: true };
  if (currentCount >= limit)            return { allowed: false, reason: limitKey + " limit reached (" + currentCount + "/" + limit + "). Upgrade your plan." };
  return { allowed: true };
}
