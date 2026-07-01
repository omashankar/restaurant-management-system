/** Admin-managed coupons — pure helpers (client + server safe). */

import {
  COUPON_CHANNELS,
  COUPON_TYPE_IDS,
  CUSTOMER_ELIGIBILITY,
  MENU_SCOPES,
  ORDER_TYPE_IDS,
  PAYMENT_METHOD_IDS,
  WEEKDAYS,
} from "./couponSchema.js";

export { COUPON_CHANNELS } from "./couponSchema.js";

export const DEFAULT_COUPON_SEEDS = [
  {
    code: "SAVE10",
    label: "Save 10% (capped)",
    type: "percent",
    value: 10,
    maxDiscount: 10,
    minSubtotal: null,
    channels: ["online", "pos"],
    active: true,
  },
  {
    code: "FLAT5",
    label: "Flat ₹5 off on orders 30+",
    type: "flat",
    value: 5,
    maxDiscount: null,
    minSubtotal: 30,
    channels: ["online", "pos"],
    active: true,
  },
];

export function normalizeCouponCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

function normalizeIdList(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((v) => String(v).trim()).filter(Boolean))];
}

function normalizeApplicableDays(value) {
  if (!Array.isArray(value) || !value.length) return WEEKDAYS.map((d) => d.id);
  return [...new Set(value.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6))];
}

function parseTimeHHMM(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!/^\d{2}:\d{2}$/.test(s)) return null;
  const [h, m] = s.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return s;
}

export function serializeCouponAdmin(doc) {
  if (!doc) return null;
  return {
    id: doc._id?.toString?.() ?? doc.id,
    code: doc.code,
    label: doc.label ?? "",
    description: doc.description ?? "",
    type: COUPON_TYPE_IDS.includes(doc.type) ? doc.type : "percent",
    value: Number(doc.value) || 0,
    maxDiscount: doc.maxDiscount != null ? Number(doc.maxDiscount) : null,
    minSubtotal: doc.minSubtotal != null ? Number(doc.minSubtotal) : null,
    maxSubtotal: doc.maxSubtotal != null ? Number(doc.maxSubtotal) : null,
    minQty: doc.minQty != null ? Number(doc.minQty) : null,
    channels: Array.isArray(doc.channels) ? doc.channels : [...COUPON_CHANNELS],
    orderTypes: Array.isArray(doc.orderTypes) && doc.orderTypes.length
      ? doc.orderTypes.filter((t) => ORDER_TYPE_IDS.includes(t))
      : [...ORDER_TYPE_IDS],
    paymentMethods: Array.isArray(doc.paymentMethods)
      ? doc.paymentMethods.filter((p) => PAYMENT_METHOD_IDS.includes(p))
      : [],
    applicableDays: normalizeApplicableDays(doc.applicableDays),
    startTime: doc.startTime ?? null,
    endTime: doc.endTime ?? null,
    applyBeforeTax: doc.applyBeforeTax !== false,
    includeDelivery: doc.includeDelivery === true || doc.type === "free_delivery",
    customerEligibility: CUSTOMER_ELIGIBILITY.some((c) => c.id === doc.customerEligibility)
      ? doc.customerEligibility
      : "all",
    menuScope: MENU_SCOPES.some((m) => m.id === doc.menuScope) ? doc.menuScope : "all",
    categoryIds: normalizeIdList(doc.categoryIds),
    itemIds: normalizeIdList(doc.itemIds),
    onePerCustomer: doc.onePerCustomer === true,
    dailyLimit: doc.dailyLimit != null ? Number(doc.dailyLimit) : null,
    monthlyLimit: doc.monthlyLimit != null ? Number(doc.monthlyLimit) : null,
    allowWithPoints: doc.allowWithPoints !== false,
    preventStacking: doc.preventStacking !== false,
    autoApply: doc.autoApply === true,
    active: doc.active !== false,
    startsAt: doc.startsAt ?? null,
    expiresAt: doc.expiresAt ?? null,
    usageLimit: doc.usageLimit != null ? Number(doc.usageLimit) : null,
    usedCount: Number(doc.usedCount) || 0,
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

/** Public fields for customer checkout UI. */
export function serializeCouponPublic(doc) {
  const row = serializeCouponAdmin(doc);
  if (!row) return null;
  return {
    code: row.code,
    label: row.label,
    description: row.description,
    type: row.type,
    value: row.value,
    maxDiscount: row.maxDiscount ?? undefined,
    minSubtotal: row.minSubtotal ?? undefined,
    orderTypes: row.orderTypes,
    autoApply: row.autoApply,
    active: row.active !== false,
  };
}

export function isCouponEligibleForSubtotal(coupon, subtotal) {
  const sub = Math.max(0, Number(subtotal) || 0);
  if (!coupon || sub <= 0) return false;
  if (coupon.minSubtotal != null && sub < Number(coupon.minSubtotal)) return false;
  if (coupon.maxSubtotal != null && sub > Number(coupon.maxSubtotal)) return false;
  return true;
}

export function formatCouponCustomerOffer(coupon) {
  if (!coupon) return { title: "", hint: "" };
  const label = String(coupon.label ?? "").trim();
  if (label) {
    const hints = [];
    if (coupon.minSubtotal != null) hints.push(`Min order ₹${coupon.minSubtotal}`);
    if (coupon.type === "percent" && coupon.maxDiscount != null) {
      hints.push(`Max ₹${coupon.maxDiscount} off`);
    }
    if (coupon.type === "free_delivery") hints.push("Free delivery");
    return { title: label, hint: hints.join(" · ") };
  }
  if (coupon.type === "free_delivery") return { title: "Free delivery", hint: "" };
  if (coupon.type === "percent") {
    const hints = [];
    if (coupon.maxDiscount != null) hints.push(`Max ₹${coupon.maxDiscount} off`);
    if (coupon.minSubtotal != null) hints.push(`Min order ₹${coupon.minSubtotal}`);
    return { title: `${coupon.value}% off`, hint: hints.join(" · ") };
  }
  const hints = [];
  if (coupon.minSubtotal != null) hints.push(`Min order ₹${coupon.minSubtotal}`);
  return { title: `₹${coupon.value} off`, hint: hints.join(" · ") };
}

export function dedupeCouponsByCode(coupons) {
  const seen = new Map();
  for (const coupon of coupons ?? []) {
    const code = normalizeCouponCode(coupon?.code);
    if (!code) continue;
    const normalized = { ...coupon, code };
    const prev = seen.get(code);
    if (!prev) {
      seen.set(code, normalized);
      continue;
    }
    const prevTime = prev.updatedAt ? new Date(prev.updatedAt).getTime() : 0;
    const curTime = normalized.updatedAt ? new Date(normalized.updatedAt).getTime() : 0;
    if (curTime >= prevTime) seen.set(code, normalized);
  }
  return [...seen.values()].sort((a, b) => a.code.localeCompare(b.code));
}

/** Split coupon savings for checkout totals (subtotal vs delivery waiver). */
export function splitCouponSavings(coupon, subtotal, context = {}) {
  if (!coupon) {
    return { subtotalDiscount: 0, deliveryDiscount: 0, totalDiscount: 0 };
  }
  const rawDelivery = Math.max(0, Number(context.deliveryCharge) || 0);
  if (coupon.type === "free_delivery") {
    const deliveryDiscount = Math.min(rawDelivery, calculateCouponDiscount(coupon, subtotal, context));
    return {
      subtotalDiscount: 0,
      deliveryDiscount,
      totalDiscount: deliveryDiscount,
    };
  }
  const subtotalDiscount = calculateCouponDiscount(coupon, subtotal, context);
  return {
    subtotalDiscount,
    deliveryDiscount: 0,
    totalDiscount: subtotalDiscount,
  };
}

export function resolveCustomerCouponFromList(coupons, code, subtotal, context = {}) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return { valid: false, error: "Enter a coupon code.", discount: 0, coupon: null };
  }
  const found = (coupons ?? []).find((c) => c.code === normalized);
  if (!found) {
    return {
      valid: false,
      error: "This code isn't available for online orders.",
      discount: 0,
      coupon: null,
    };
  }
  if (found.active === false) {
    return {
      valid: false,
      error: "This coupon is no longer active.",
      discount: 0,
      coupon: null,
    };
  }
  return validateCouponDoc(found, subtotal, "online", context);
}

function isInTimeWindow(coupon, now = new Date()) {
  const start = coupon.startTime;
  const end = coupon.endTime;
  if (!start && !end) return true;
  const mins = now.getHours() * 60 + now.getMinutes();
  const toMins = (t) => {
    const [h, m] = String(t).split(":").map(Number);
    return h * 60 + m;
  };
  if (start && end) {
    const s = toMins(start);
    const e = toMins(end);
    if (s <= e) return mins >= s && mins <= e;
    return mins >= s || mins <= e;
  }
  if (start) return mins >= toMins(start);
  return mins <= toMins(end);
}

function isCouponInDateWindow(coupon, now = new Date()) {
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return false;
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return false;
  const day = now.getDay();
  const days = Array.isArray(coupon.applicableDays) ? coupon.applicableDays : WEEKDAYS.map((d) => d.id);
  if (days.length && !days.includes(day)) return false;
  return isInTimeWindow(coupon, now);
}

export function calculateCouponDiscount(coupon, subtotal, context = {}) {
  const sub = Math.max(0, Number(subtotal) || 0);
  if (!coupon || sub <= 0) return 0;

  if (coupon.minSubtotal != null && sub < Number(coupon.minSubtotal)) return 0;
  if (coupon.maxSubtotal != null && sub > Number(coupon.maxSubtotal)) return 0;

  if (coupon.type === "free_delivery") {
    return Math.max(0, Number(context.deliveryCharge) || 0);
  }

  if (coupon.type === "percent") {
    const raw = (sub * Number(coupon.value ?? 0)) / 100;
    const max = coupon.maxDiscount != null ? Number(coupon.maxDiscount) : raw;
    return Math.min(raw, max, sub);
  }

  if (coupon.type === "flat") {
    return Math.min(sub, Math.max(0, Number(coupon.value ?? 0)));
  }

  return 0;
}

export function couponDiscountToPosFields(coupon, discountAmount, subtotal) {
  const amount = Math.max(0, Number(discountAmount) || 0);
  const sub = Math.max(0, Number(subtotal) || 0);
  if (amount <= 0 || !coupon) {
    return { discountType: "none", discountPercent: 0, discountFixed: 0 };
  }

  if (coupon.type === "percent") {
    const uncapped = (sub * Number(coupon.value ?? 0)) / 100;
    const capped = coupon.maxDiscount != null && amount < uncapped - 0.001;
    if (!capped) {
      return {
        discountType: "percent",
        discountPercent: Math.min(100, Number(coupon.value) || 0),
        discountFixed: 0,
      };
    }
  }

  return {
    discountType: "fixed",
    discountPercent: 0,
    discountFixed: parseFloat(amount.toFixed(2)),
  };
}

/**
 * @param {object} context
 * @param {number} context.subtotal
 * @param {string} context.channel
 * @param {string} [context.orderType]
 * @param {string} [context.paymentMethod]
 * @param {number} [context.itemQty]
 * @param {string[]} [context.cartItemIds]
 * @param {string[]} [context.cartCategoryIds]
 * @param {number} [context.deliveryCharge]
 * @param {boolean} [context.hasPointsApplied]
 * @param {boolean} [context.hasOtherDiscount]
 */
export function validateCouponDoc(coupon, subtotal, channel = "online", context = {}) {
  if (!coupon) {
    return { valid: false, error: "Invalid coupon code.", discount: 0, coupon: null };
  }

  if (coupon.active === false) {
    return { valid: false, error: "This coupon is no longer active.", discount: 0, coupon: null };
  }

  const channels = Array.isArray(coupon.channels) ? coupon.channels : COUPON_CHANNELS;
  if (!channels.includes(channel)) {
    return { valid: false, error: "This coupon cannot be used here.", discount: 0, coupon: null };
  }

  if (!isCouponInDateWindow(coupon)) {
    return { valid: false, error: "This coupon has expired or is not valid right now.", discount: 0, coupon: null };
  }

  if (coupon.usageLimit != null && Number(coupon.usedCount) >= Number(coupon.usageLimit)) {
    return { valid: false, error: "This coupon has reached its usage limit.", discount: 0, coupon: null };
  }

  const orderType = context.orderType;
  const orderTypes = Array.isArray(coupon.orderTypes) ? coupon.orderTypes : ORDER_TYPE_IDS;
  if (orderType && orderTypes.length && !orderTypes.includes(orderType)) {
    return {
      valid: false,
      error: `This coupon is not valid for ${orderType} orders.`,
      discount: 0,
      coupon: null,
    };
  }

  const paymentMethod = context.paymentMethod;
  const paymentMethods = Array.isArray(coupon.paymentMethods) ? coupon.paymentMethods : [];
  if (paymentMethod && paymentMethods.length && !paymentMethods.includes(paymentMethod)) {
    return {
      valid: false,
      error: "This coupon is not valid for the selected payment method.",
      discount: 0,
      coupon: null,
    };
  }

  const sub = Number(subtotal) || 0;
  if (coupon.minSubtotal != null && sub < Number(coupon.minSubtotal)) {
    return {
      valid: false,
      error: `Minimum order of ${coupon.minSubtotal} required for this coupon.`,
      discount: 0,
      coupon: null,
    };
  }

  if (coupon.maxSubtotal != null && sub > Number(coupon.maxSubtotal)) {
    return {
      valid: false,
      error: `Maximum order of ${coupon.maxSubtotal} for this coupon.`,
      discount: 0,
      coupon: null,
    };
  }

  const qty = Number(context.itemQty) || 0;
  if (coupon.minQty != null && qty > 0 && qty < Number(coupon.minQty)) {
    return {
      valid: false,
      error: `Minimum ${coupon.minQty} items required for this coupon.`,
      discount: 0,
      coupon: null,
    };
  }

  if (coupon.menuScope === "items" && coupon.itemIds?.length) {
    const cartIds = context.cartItemIds ?? [];
    const match = cartIds.some((id) => coupon.itemIds.includes(String(id)));
    if (cartIds.length && !match) {
      return { valid: false, error: "Coupon not valid for items in your cart.", discount: 0, coupon: null };
    }
  }

  if (coupon.menuScope === "categories" && coupon.categoryIds?.length) {
    const cartCats = context.cartCategoryIds ?? [];
    const match = cartCats.some((id) => coupon.categoryIds.includes(String(id)));
    if (cartCats.length && !match) {
      return { valid: false, error: "Coupon not valid for categories in your cart.", discount: 0, coupon: null };
    }
  }

  if (coupon.preventStacking && context.hasOtherDiscount) {
    return { valid: false, error: "Remove other discounts before applying this coupon.", discount: 0, coupon: null };
  }

  if (!coupon.allowWithPoints && context.hasPointsApplied) {
    return { valid: false, error: "This coupon cannot be used with reward points.", discount: 0, coupon: null };
  }

  const discount = calculateCouponDiscount(coupon, sub, context);
  if (discount <= 0 && coupon.type !== "free_delivery") {
    return { valid: false, error: "Coupon cannot be applied to this order.", discount: 0, coupon: null };
  }
  if (coupon.type === "free_delivery" && discount <= 0) {
    return { valid: false, error: "No delivery charge to waive.", discount: 0, coupon: null };
  }

  const serialized = serializeCouponAdmin(coupon);
  const posDiscount = couponDiscountToPosFields(serialized, discount, sub);

  return {
    valid: true,
    error: null,
    discount: parseFloat(discount.toFixed(2)),
    coupon: serialized,
    posDiscount,
  };
}

export function parseCouponInput(body = {}) {
  const code = normalizeCouponCode(body.code);
  const label = String(body.label ?? "").trim();
  const description = String(body.description ?? "").trim();
  const type = COUPON_TYPE_IDS.includes(body.type) ? body.type : "percent";
  const rawValue = Number(body.value);
  const value = type === "free_delivery" ? 0 : rawValue;
  const maxDiscount = body.maxDiscount === "" || body.maxDiscount == null ? null : Number(body.maxDiscount);
  const minSubtotal = body.minSubtotal === "" || body.minSubtotal == null ? null : Number(body.minSubtotal);
  const maxSubtotal = body.maxSubtotal === "" || body.maxSubtotal == null ? null : Number(body.maxSubtotal);
  const minQty = body.minQty === "" || body.minQty == null ? null : Math.floor(Number(body.minQty));
  const channels = Array.isArray(body.channels)
    ? body.channels.filter((c) => COUPON_CHANNELS.includes(c))
    : COUPON_CHANNELS;
  const orderTypes = Array.isArray(body.orderTypes)
    ? body.orderTypes.filter((t) => ORDER_TYPE_IDS.includes(t))
    : [...ORDER_TYPE_IDS];
  const paymentMethods = Array.isArray(body.paymentMethods)
    ? body.paymentMethods.filter((p) => PAYMENT_METHOD_IDS.includes(p))
    : [];
  const applicableDays = normalizeApplicableDays(body.applicableDays);
  const active = body.active !== false;
  const usageLimit = body.usageLimit === "" || body.usageLimit == null ? null : Math.floor(Number(body.usageLimit));
  const dailyLimit = body.dailyLimit === "" || body.dailyLimit == null ? null : Math.floor(Number(body.dailyLimit));
  const monthlyLimit = body.monthlyLimit === "" || body.monthlyLimit == null ? null : Math.floor(Number(body.monthlyLimit));
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
  const startTime = parseTimeHHMM(body.startTime);
  const endTime = parseTimeHHMM(body.endTime);

  const errors = [];
  if (!code) errors.push("Coupon code is required.");
  if (!label) errors.push("Coupon name is required.");
  if (type !== "free_delivery" && (!Number.isFinite(value) || value <= 0)) {
    errors.push("Value must be greater than 0.");
  }
  if (type === "percent" && value > 100) errors.push("Percent cannot exceed 100.");
  if (type === "free_delivery" && value !== 0 && !Number.isFinite(value)) {
    // value optional for free delivery
  }
  if (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
    errors.push("Max discount must be a positive number.");
  }
  if (minSubtotal != null && (!Number.isFinite(minSubtotal) || minSubtotal < 0)) {
    errors.push("Minimum subtotal must be zero or more.");
  }
  if (maxSubtotal != null && (!Number.isFinite(maxSubtotal) || maxSubtotal < 0)) {
    errors.push("Maximum subtotal must be zero or more.");
  }
  if (minSubtotal != null && maxSubtotal != null && minSubtotal > maxSubtotal) {
    errors.push("Minimum subtotal cannot exceed maximum.");
  }
  if (usageLimit != null && (!Number.isFinite(usageLimit) || usageLimit < 1)) {
    errors.push("Usage limit must be at least 1.");
  }
  if (dailyLimit != null && (!Number.isFinite(dailyLimit) || dailyLimit < 1)) {
    errors.push("Daily limit must be at least 1.");
  }
  if (monthlyLimit != null && (!Number.isFinite(monthlyLimit) || monthlyLimit < 1)) {
    errors.push("Monthly limit must be at least 1.");
  }
  if (startsAt && Number.isNaN(startsAt.getTime())) errors.push("Invalid start date.");
  if (expiresAt && Number.isNaN(expiresAt.getTime())) errors.push("Invalid expiry date.");
  if (startsAt && expiresAt && startsAt > expiresAt) errors.push("Start date must be before expiry.");
  if (!orderTypes.length) errors.push("Select at least one order type.");

  const menuScope = MENU_SCOPES.some((m) => m.id === body.menuScope) ? body.menuScope : "all";
  const customerEligibility = CUSTOMER_ELIGIBILITY.some((c) => c.id === body.customerEligibility)
    ? body.customerEligibility
    : "all";

  return {
    ok: errors.length === 0,
    errors,
    data: {
      code,
      label,
      description,
      type,
      value: type === "free_delivery" ? 0 : value,
      maxDiscount,
      minSubtotal,
      maxSubtotal,
      minQty,
      channels: channels.length ? channels : COUPON_CHANNELS,
      orderTypes,
      paymentMethods,
      applicableDays,
      startTime,
      endTime,
      applyBeforeTax: body.applyBeforeTax !== false,
      includeDelivery: body.includeDelivery === true || type === "free_delivery",
      customerEligibility,
      menuScope,
      categoryIds: normalizeIdList(body.categoryIds),
      itemIds: normalizeIdList(body.itemIds),
      onePerCustomer: body.onePerCustomer === true,
      dailyLimit,
      monthlyLimit,
      allowWithPoints: body.allowWithPoints !== false,
      preventStacking: body.preventStacking !== false,
      autoApply: body.autoApply === true,
      active,
      usageLimit,
      startsAt,
      expiresAt,
    },
  };
}

export function couponsToCsvRows(coupons) {
  const header = [
    "Code",
    "Name",
    "Type",
    "Value",
    "Status",
    "Channels",
    "Used",
    "Limit",
    "Starts",
    "Expires",
  ];
  const rows = (coupons ?? []).map((c) => [
    c.code,
    c.label,
    c.type,
    c.value,
    c.active === false ? "Inactive" : "Active",
    (c.channels ?? []).join("|"),
    c.usedCount ?? 0,
    c.usageLimit ?? "",
    c.startsAt ? new Date(c.startsAt).toISOString().slice(0, 10) : "",
    c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 10) : "",
  ]);
  return [header, ...rows];
}

export function toCsvString(rows) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? "");
          return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}
