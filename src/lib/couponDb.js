import { couponStatusLabel } from "./couponSchema.js";
import {
  DEFAULT_COUPON_SEEDS,
  dedupeCouponsByCode,
  normalizeCouponCode,
  serializeCouponAdmin,
  serializeCouponPublic,
  validateCouponDoc,
} from "@/lib/couponUtils";
import { ObjectId } from "mongodb";

const USAGE_COLLECTION = "coupon_usages";

function normalizeRestaurantId(restaurantId) {
  if (!restaurantId) return restaurantId;
  if (restaurantId instanceof ObjectId) return restaurantId;
  try {
    return new ObjectId(String(restaurantId));
  } catch {
    return restaurantId;
  }
}

function couponHasUsageRemainingFilter() {
  return {
    $or: [
      { usageLimit: { $exists: false } },
      { usageLimit: null },
      { $expr: { $lt: [{ $ifNull: ["$usedCount", 0] }, "$usageLimit"] } },
    ],
  };
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function ensureCouponIndexes(db) {
  try {
    await db.collection("coupons").createIndex({ restaurantId: 1, code: 1 }, { unique: true });
    await db.collection(USAGE_COLLECTION).createIndex({ restaurantId: 1, redeemedAt: -1 });
    await db.collection(USAGE_COLLECTION).createIndex({ restaurantId: 1, couponId: 1, redeemedAt: -1 });
    await db.collection(USAGE_COLLECTION).createIndex({ restaurantId: 1, customerId: 1, couponId: 1 });
  } catch {
    /* index may already exist */
  }
}

export async function findCouponByCode(db, restaurantId, code) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  const rid = normalizeRestaurantId(restaurantId);
  const base = { restaurantId: rid, code: normalized };
  const active = await db.collection("coupons").findOne(
    { ...base, active: { $ne: false } },
    { sort: { updatedAt: -1 } },
  );
  if (active) return active;
  return db.collection("coupons").findOne(base, { sort: { updatedAt: -1 } });
}

async function countUsages(db, restaurantId, couponId, since = null, customerId = null) {
  const filter = { restaurantId: normalizeRestaurantId(restaurantId), couponId: new ObjectId(couponId) };
  if (since) filter.redeemedAt = { $gte: since };
  if (customerId) filter.customerId = customerId;
  return db.collection(USAGE_COLLECTION).countDocuments(filter);
}

/** Redemption totals from usage history — source of truth for admin display. */
export async function attachRedemptionCounts(db, restaurantId, coupons = []) {
  const rid = normalizeRestaurantId(restaurantId);
  const rows = await db
    .collection(USAGE_COLLECTION)
    .aggregate([
      { $match: { restaurantId: rid } },
      { $group: { _id: "$couponCode", count: { $sum: 1 } } },
    ])
    .toArray();
  const map = new Map(rows.map((r) => [r._id, r.count]));
  return coupons.map((c) => ({
    ...c,
    usedCount: map.get(c.code) ?? (Number(c.usedCount) || 0),
  }));
}

async function validateUsageLimits(db, restaurantId, coupon, customerId) {
  const couponId = coupon.id ?? coupon._id;
  if (coupon.usageLimit != null && couponId) {
    const total = await countUsages(db, restaurantId, couponId);
    if (total >= Number(coupon.usageLimit)) {
      return { valid: false, error: "This coupon has reached its usage limit." };
    }
  }
  if (coupon.onePerCustomer && customerId) {
    const prior = await countUsages(db, restaurantId, coupon.id ?? coupon._id, null, customerId);
    if (prior > 0) {
      return { valid: false, error: "You have already used this coupon." };
    }
  }
  if (coupon.dailyLimit != null) {
    const today = await countUsages(db, restaurantId, coupon.id ?? coupon._id, startOfDay());
    if (today >= Number(coupon.dailyLimit)) {
      return { valid: false, error: "Daily redemption limit reached for this coupon." };
    }
  }
  if (coupon.monthlyLimit != null) {
    const month = await countUsages(db, restaurantId, coupon.id ?? coupon._id, startOfMonth());
    if (month >= Number(coupon.monthlyLimit)) {
      return { valid: false, error: "Monthly redemption limit reached for this coupon." };
    }
  }
  return { valid: true };
}

export async function validateCouponForOrder(
  db,
  restaurantId,
  code,
  subtotal,
  channel = "online",
  context = {},
) {
  const coupon = await findCouponByCode(db, restaurantId, code);
  if (!coupon) {
    return { valid: false, error: "Invalid coupon code.", discount: 0, coupon: null };
  }

  const couponId = coupon._id ?? coupon.id;
  const usageTotal = couponId ? await countUsages(db, restaurantId, couponId) : Number(coupon.usedCount) || 0;
  const couponForValidate = { ...coupon, usedCount: usageTotal };

  const base = validateCouponDoc(couponForValidate, subtotal, channel, context);
  if (!base.valid) return base;

  const serialized = base.coupon;
  const limitCheck = await validateUsageLimits(db, restaurantId, serialized, context.customerId ?? null);
  if (!limitCheck.valid) {
    return { valid: false, error: limitCheck.error, discount: 0, coupon: null };
  }

  if (serialized.customerEligibility && serialized.customerEligibility !== "all") {
    const segment = context.customerSegment ?? "all";
    if (segment !== "all" && segment !== serialized.customerEligibility) {
      return {
        valid: false,
        error: "You are not eligible for this coupon.",
        discount: 0,
        coupon: null,
      };
    }
  }

  return base;
}

export async function listActiveCouponsForChannel(db, restaurantId, channel = "online") {
  const now = new Date();
  const rows = await db
    .collection("coupons")
    .find({
      restaurantId,
      active: { $ne: false },
      channels: channel,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }] },
      ],
    })
    .sort({ code: 1 })
    .toArray();

  const adminRows = dedupeCouponsByCode(rows.map(serializeCouponAdmin));
  const withCounts = await attachRedemptionCounts(db, restaurantId, adminRows);

  return withCounts
    .filter((row) => row.active !== false)
    .filter((row) => couponStatusLabel(row) === "active")
    .filter((row) => row.usageLimit == null || Number(row.usedCount) < Number(row.usageLimit))
    .map((row) => serializeCouponPublic(row))
    .filter(Boolean);
}

export async function seedCouponsIfEmpty(db, restaurantId, createdBy = null) {
  await ensureCouponIndexes(db);
  const now = new Date();
  let inserted = false;
  const defaults = defaultCouponRulesFromSeeds();

  for (const seed of DEFAULT_COUPON_SEEDS) {
    const code = normalizeCouponCode(seed.code);
    const existing = await db.collection("coupons").findOne({ restaurantId, code });
    if (existing) continue;

    await db.collection("coupons").insertOne({
      restaurantId,
      code,
      label: seed.label,
      description: "",
      type: seed.type,
      value: seed.value,
      maxDiscount: seed.maxDiscount ?? null,
      minSubtotal: seed.minSubtotal ?? null,
      channels: seed.channels ?? ["online", "pos"],
      active: seed.active !== false,
      startsAt: null,
      expiresAt: null,
      usageLimit: null,
      usedCount: 0,
      createdBy,
      createdAt: now,
      updatedAt: now,
      ...defaults,
    });
    inserted = true;
  }

  return inserted;
}

function defaultCouponRulesFromSeeds() {
  return {
    orderTypes: ["dine-in", "takeaway", "delivery"],
    paymentMethods: [],
    applicableDays: [0, 1, 2, 3, 4, 5, 6],
    applyBeforeTax: true,
    allowWithPoints: true,
    preventStacking: true,
    customerEligibility: "all",
    menuScope: "all",
    categoryIds: [],
    itemIds: [],
  };
}

/** Atomically increment usage and write redemption history. */
export async function redeemCoupon(db, restaurantId, couponId, usage = {}) {
  if (!couponId) return { ok: false, error: "Missing coupon." };
  let oid;
  try {
    oid = new ObjectId(couponId);
  } catch {
    return { ok: false, error: "Invalid coupon." };
  }

  const rid = normalizeRestaurantId(restaurantId);
  const filter = {
    restaurantId: rid,
    _id: oid,
    active: { $ne: false },
    ...couponHasUsageRemainingFilter(),
  };

  const updateResult = await db.collection("coupons").updateOne(filter, {
    $inc: { usedCount: 1 },
    $set: { updatedAt: new Date() },
  });

  if (updateResult.matchedCount === 0) {
    return { ok: false, error: "Coupon usage limit reached or coupon inactive." };
  }

  const doc = await db.collection("coupons").findOne({ _id: oid, restaurantId: rid });
  if (!doc?.code) {
    return { ok: false, error: "Coupon not found after redemption." };
  }

  await db.collection(USAGE_COLLECTION).insertOne({
    restaurantId: rid,
    couponId: oid,
    couponCode: doc.code,
    orderId: usage.orderId ?? null,
    orderMongoId: usage.orderMongoId ?? null,
    channel: usage.channel ?? "online",
    customerId: usage.customerId ?? null,
    customerName: usage.customerName ?? null,
    discountAmount: Number(usage.discountAmount) || 0,
    orderSubtotal: Number(usage.orderSubtotal) || 0,
    orderTotal: Number(usage.orderTotal) || 0,
    redeemedAt: new Date(),
  });

  return { ok: true, coupon: serializeCouponAdmin(doc) };
}

/** @deprecated Use redeemCoupon */
export async function incrementCouponUsage(db, restaurantId, couponId) {
  return redeemCoupon(db, restaurantId, couponId, {});
}

export async function listCouponUsages(db, restaurantId, { page = 1, limit = 20, couponCode = "" } = {}) {
  const skip = (Math.max(1, page) - 1) * limit;
  const filter = { restaurantId };
  if (couponCode) filter.couponCode = normalizeCouponCode(couponCode);

  const [rows, total] = await Promise.all([
    db
      .collection(USAGE_COLLECTION)
      .find(filter)
      .sort({ redeemedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection(USAGE_COLLECTION).countDocuments(filter),
  ]);

  return {
    usages: rows.map((r) => ({
      id: r._id.toString(),
      couponCode: r.couponCode,
      couponId: r.couponId?.toString?.() ?? null,
      orderId: r.orderId,
      channel: r.channel,
      customerName: r.customerName,
      discountAmount: r.discountAmount,
      orderSubtotal: r.orderSubtotal,
      orderTotal: r.orderTotal,
      redeemedAt: r.redeemedAt,
    })),
    total,
    page,
    limit,
  };
}

export async function getCouponStats(db, restaurantId) {
  const now = new Date();
  const coupons = await db.collection("coupons").find({ restaurantId }).toArray();
  const unique = dedupeCouponsByCode(coupons.map(serializeCouponAdmin));

  let active = 0;
  let expired = 0;
  let inactive = 0;
  for (const c of unique) {
    const status = couponStatusLabel(c, now);
    if (status === "active") active += 1;
    else if (status === "expired") expired += 1;
    else if (status === "inactive") inactive += 1;
  }

  const usageAgg = await db
    .collection(USAGE_COLLECTION)
    .aggregate([
      { $match: { restaurantId } },
      {
        $group: {
          _id: null,
          redemptions: { $sum: 1 },
          totalDiscount: { $sum: "$discountAmount" },
          totalSales: { $sum: "$orderTotal" },
        },
      },
    ])
    .toArray();

  const totals = usageAgg[0] ?? { redemptions: 0, totalDiscount: 0, totalSales: 0 };

  const topCoupons = await db
    .collection(USAGE_COLLECTION)
    .aggregate([
      { $match: { restaurantId } },
      { $group: { _id: "$couponCode", count: { $sum: 1 }, discount: { $sum: "$discountAmount" } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  const redemptionRate =
    unique.length > 0 ? Number(((totals.redemptions / unique.length) * 100).toFixed(1)) : 0;

  return {
    totalCoupons: unique.length,
    activeCoupons: active,
    expiredCoupons: expired,
    inactiveCoupons: inactive,
    couponsRedeemed: totals.redemptions,
    redemptionRate,
    totalDiscountGiven: Number((totals.totalDiscount ?? 0).toFixed(2)),
    salesThroughCoupons: Number((totals.totalSales ?? 0).toFixed(2)),
    topCoupons: topCoupons.map((r) => ({
      code: r._id,
      redemptions: r.count,
      discount: Number((r.discount ?? 0).toFixed(2)),
    })),
  };
}

export async function duplicateCoupon(db, restaurantId, couponId, createdBy) {
  const filter = { restaurantId, _id: new ObjectId(couponId) };
  const source = await db.collection("coupons").findOne(filter);
  if (!source) return null;

  let suffix = 1;
  let code = `${source.code}_COPY`;
  while (await db.collection("coupons").findOne({ restaurantId, code })) {
    suffix += 1;
    code = `${source.code}_COPY${suffix}`;
  }

  const now = new Date();
  const { _id, usedCount, createdAt, updatedAt, ...rest } = source;
  const doc = {
    ...rest,
    code,
    label: `${source.label} (Copy)`,
    usedCount: 0,
    active: false,
    createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection("coupons").insertOne(doc);
  return serializeCouponAdmin({ ...doc, _id: result.insertedId });
}
