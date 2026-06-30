import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateCouponDiscount,
  couponDiscountToPosFields,
  dedupeCouponsByCode,
  formatCouponCustomerOffer,
  isCouponEligibleForSubtotal,
  resolveCustomerCouponFromList,
  splitCouponSavings,
  validateCouponDoc,
} from "../src/lib/couponUtils.js";

const baseCoupon = {
  id: "1",
  code: "SAVE10",
  label: "Save 10%",
  type: "percent",
  value: 10,
  maxDiscount: 10,
  channels: ["online", "pos"],
  active: true,
  usedCount: 0,
};

test("percent coupon respects max discount cap", () => {
  assert.equal(calculateCouponDiscount(baseCoupon, 200), 10);
  assert.equal(calculateCouponDiscount(baseCoupon, 50), 5);
});

test("flat coupon requires min subtotal", () => {
  const flat = { ...baseCoupon, type: "flat", value: 5, maxDiscount: null, minSubtotal: 30 };
  assert.equal(calculateCouponDiscount(flat, 20), 0);
  assert.equal(calculateCouponDiscount(flat, 40), 5);
});

test("validateCouponDoc rejects wrong channel", () => {
  const result = validateCouponDoc(
    { ...baseCoupon, channels: ["online"] },
    100,
    "pos",
  );
  assert.equal(result.valid, false);
});

test("couponDiscountToPosFields uses percent when uncapped", () => {
  const fields = couponDiscountToPosFields(baseCoupon, 5, 50);
  assert.equal(fields.discountType, "percent");
  assert.equal(fields.discountPercent, 10);
});

test("formatCouponCustomerOffer uses admin label", () => {
  const { title, hint } = formatCouponCustomerOffer(baseCoupon);
  assert.equal(title, "Save 10%");
  assert.match(hint, /Max/);
});

test("isCouponEligibleForSubtotal checks minimum", () => {
  const flat = { ...baseCoupon, minSubtotal: 30 };
  assert.equal(isCouponEligibleForSubtotal(flat, 20), false);
  assert.equal(isCouponEligibleForSubtotal(flat, 40), true);
});

test("resolveCustomerCouponFromList rejects unknown and pos-only codes", () => {
  const list = [{ ...baseCoupon, code: "SAVE10", channels: ["online"] }];
  const missing = resolveCustomerCouponFromList(list, "NOPE", 100);
  assert.equal(missing.valid, false);
  assert.match(missing.error, /online/i);

  const ok = resolveCustomerCouponFromList(list, "save10", 100);
  assert.equal(ok.valid, true);
  assert.equal(ok.discount, 10);
});

test("dedupeCouponsByCode keeps one entry per code", () => {
  const dupes = [
    { code: "FLAT5", label: "A", updatedAt: "2024-01-01" },
    { code: "FLAT5", label: "B", updatedAt: "2025-01-01" },
    { code: "SAVE10", label: "Save" },
  ];
  const out = dedupeCouponsByCode(dupes);
  assert.equal(out.length, 2);
  assert.equal(out.find((c) => c.code === "FLAT5")?.label, "B");
});

test("splitCouponSavings waives delivery only for free_delivery type", () => {
  const coupon = { type: "free_delivery", value: 0 };
  const out = splitCouponSavings(coupon, 100, { deliveryCharge: 25 });
  assert.equal(out.subtotalDiscount, 0);
  assert.equal(out.deliveryDiscount, 25);
  assert.equal(out.totalDiscount, 25);
});

test("validateCouponDoc rejects wrong order type", () => {
  const coupon = {
    ...baseCoupon,
    orderTypes: ["delivery"],
  };
  const bad = validateCouponDoc(coupon, 100, "online", { orderType: "takeaway" });
  assert.equal(bad.valid, false);
  const ok = validateCouponDoc(coupon, 100, "online", { orderType: "delivery" });
  assert.equal(ok.valid, true);
});
