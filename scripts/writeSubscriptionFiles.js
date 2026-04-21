/**
 * Writes all subscription-related files that fsWrite failed to create.
 * Run: node scripts/writeSubscriptionFiles.js
 */
const fs   = require("fs");
const path = require("path");

function write(relPath, content) {
  const abs = path.resolve(__dirname, "..", relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
  console.log("✅  Written:", relPath);
}

/* ─────────────────────────────────────────
   src/lib/subscription.js
───────────────────────────────────────── */
write("src/lib/subscription.js", `
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
`.trimStart());

/* ─────────────────────────────────────────
   src/app/api/subscription/route.js
───────────────────────────────────────── */
write("src/app/api/subscription/route.js", `
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { getSubscription } from "@/lib/subscription";

export async function GET(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  if (payload.role === "super_admin") return Response.json({ success: false, error: "Not applicable for super admin." }, { status: 400 });
  if (!payload.restaurantId) return Response.json({ success: false, error: "No restaurant associated." }, { status: 400 });

  try {
    const sub = await getSubscription(payload.restaurantId);
    if (!sub) {
      return Response.json({
        success: true,
        subscription: {
          planSlug: "free", planName: "Free", status: "active",
          price: 0, daysLeft: null, startDate: null, endDate: null,
          limits: { staff: 3, tables: 5, menuItems: 20, orders: 100 },
          features: [],
        },
      });
    }
    return Response.json({ success: true, subscription: sub });
  } catch (err) {
    console.error("GET /api/subscription error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
`.trimStart());

/* ─────────────────────────────────────────
   src/app/api/super-admin/subscriptions/route.js
───────────────────────────────────────── */
write("src/app/api/super-admin/subscriptions/route.js", `
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { assignPlan } from "@/lib/subscription";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function GET(request) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "all";

    const client = await clientPromise;
    const db     = client.db();

    const filter = {};
    if (statusFilter !== "all") filter.status = statusFilter;

    const subs = await db.collection("subscriptions").find(filter).sort({ updatedAt: -1 }).toArray();

    const rIds = [...new Set(subs.map((s) => s.restaurantId?.toString()).filter(Boolean))];
    let restaurantMap = {};
    if (rIds.length) {
      const restaurants = await db.collection("restaurants")
        .find({ _id: { $in: rIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) } },
               { projection: { name: 1, ownerEmail: 1, status: 1 } })
        .toArray();
      restaurantMap = Object.fromEntries(restaurants.map((r) => [r._id.toString(), r]));
    }

    const now = new Date();
    return Response.json({
      success: true,
      subscriptions: subs.map((s) => {
        const r        = restaurantMap[s.restaurantId?.toString()] ?? null;
        const daysLeft = s.endDate ? Math.max(0, Math.ceil((new Date(s.endDate) - now) / 86_400_000)) : null;
        return {
          id:               s._id.toString(),
          restaurantId:     s.restaurantId?.toString() ?? null,
          restaurantName:   r?.name       ?? "—",
          restaurantEmail:  r?.ownerEmail ?? "—",
          restaurantStatus: r?.status     ?? "active",
          planSlug:         s.planSlug    ?? "free",
          planName:         s.planName    ?? "Free",
          price:            s.price       ?? 0,
          billingCycle:     s.billingCycle ?? "monthly",
          status:           s.status      ?? "active",
          startDate:        s.startDate,
          endDate:          s.endDate,
          trialEnd:         s.trialEnd    ?? null,
          daysLeft,
          limits:           s.limits      ?? {},
          createdAt:        s.createdAt,
          updatedAt:        s.updatedAt,
        };
      }),
    });
  } catch (err) {
    console.error("GET subscriptions error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { restaurantId, planSlug, startDate, endDate, trialDays } = body;
  if (!restaurantId) return Response.json({ success: false, error: "restaurantId is required." }, { status: 400 });
  if (!planSlug)     return Response.json({ success: false, error: "planSlug is required." },     { status: 400 });

  try {
    const sub = await assignPlan(restaurantId, planSlug, { startDate, endDate, trialDays });
    return Response.json({ success: true, subscription: sub }, { status: 201 });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return Response.json({ success: false, error: err.message }, { status });
  }
}
`.trimStart());

/* ─────────────────────────────────────────
   src/app/api/super-admin/subscriptions/[id]/route.js
───────────────────────────────────────── */
write("src/app/api/super-admin/subscriptions/[id]/route.js", `
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function toOid(id) { try { return new ObjectId(id); } catch { return null; } }

export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const client = await clientPromise;
  const db     = client.db();

  const sub = await db.collection("subscriptions").findOne({ _id });
  if (!sub) return Response.json({ success: false, error: "Subscription not found." }, { status: 404 });

  const update = { updatedAt: new Date() };
  if (body.status && ["active","expired","cancelled","trial"].includes(body.status)) update.status = body.status;
  if (body.endDate) {
    update.endDate = new Date(body.endDate);
    if (new Date(body.endDate) > new Date()) update.status = update.status ?? "active";
  }
  if (body.startDate) update.startDate = new Date(body.startDate);

  await db.collection("subscriptions").updateOne({ _id }, { $set: update });
  return Response.json({ success: true });
}

export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();
    const sub = await db.collection("subscriptions").findOne({ _id });
    if (!sub) return Response.json({ success: false, error: "Subscription not found." }, { status: 404 });
    await db.collection("subscriptions").updateOne({ _id }, { $set: { status: "cancelled", updatedAt: new Date() } });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
`.trimStart());

/* ─────────────────────────────────────────
   src/app/api/super-admin/restaurants/[id]/plan/route.js
───────────────────────────────────────── */
write("src/app/api/super-admin/restaurants/[id]/plan/route.js", `
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { assignPlan } from "@/lib/subscription";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { plan, startDate, endDate, trialDays } = body;
  if (!plan?.trim()) return Response.json({ success: false, error: "Plan slug is required." }, { status: 400 });

  try {
    await assignPlan(id, plan.trim(), { startDate, endDate, trialDays });
    return Response.json({ success: true, plan: plan.trim() });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return Response.json({ success: false, error: err.message }, { status });
  }
}
`.trimStart());

console.log("\nAll files written successfully.");
