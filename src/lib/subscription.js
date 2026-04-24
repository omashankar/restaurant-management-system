import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function computeEndDate(startDate, billingCycle) {
  const d = new Date(startDate);
  if (billingCycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function getSubscription(restaurantId) {
  const client = await clientPromise;
  const db     = client.db();
  const _rid   = typeof restaurantId === "string" ? new ObjectId(restaurantId) : restaurantId;

  const sub = await db.collection("subscriptions").findOne(
    { restaurantId: _rid },
    { sort: { createdAt: -1 } }
  );
  if (!sub) return null;

  const now = new Date();
  if (sub.status === "active" && sub.endDate && sub.endDate < now) {
    await db.collection("subscriptions").updateOne(
      { _id: sub._id },
      { $set: { status: "expired", updatedAt: now } }
    );
    sub.status = "expired";
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
    status:       sub.status      ?? "active",
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

  const now       = new Date();
  const startDate = options.startDate ? new Date(options.startDate) : now;
  const endDate   = options.endDate
    ? new Date(options.endDate)
    : computeEndDate(startDate, plan.billingCycle ?? "monthly");

  const trialDays = options.trialDays ?? plan.trialDays ?? 0;
  const trialEnd  = trialDays > 0 ? addDays(startDate, trialDays) : null;
  const status    = trialEnd && trialEnd > now ? "trial" : "active";

  const subDoc = {
    restaurantId:  _rid,
    planId:        plan._id,
    planSlug:      plan.slug,
    planName:      plan.name,
    limits:        plan.limits      ?? {},
    features:      plan.features    ?? [],
    price:         plan.price       ?? 0,
    billingCycle:  plan.billingCycle ?? "monthly",
    startDate,
    endDate,
    trialEnd,
    status,
    updatedAt: now,
  };

  const result = await db.collection("subscriptions").findOneAndUpdate(
    { restaurantId: _rid },
    { $set: subDoc, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "after" }
  );

  await db.collection("restaurants").updateOne(
    { _id: _rid },
    { $set: { plan: plan.slug, planAssignedAt: now, updatedAt: now } }
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
