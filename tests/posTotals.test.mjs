import test from "node:test";
import assert from "node:assert/strict";
import {
  calculatePosDiscountAmount,
  calculatePosTotals,
  resolvePosDiscountInput,
} from "../src/lib/posTotals.js";

test("percent discount capped at subtotal", () => {
  assert.equal(calculatePosDiscountAmount(200, { type: "percent", percent: 10 }), 20);
  assert.equal(calculatePosDiscountAmount(200, { type: "percent", percent: 150 }), 200);
});

test("fixed discount capped at subtotal", () => {
  assert.equal(calculatePosDiscountAmount(200, { type: "fixed", fixed: 50 }), 50);
  assert.equal(calculatePosDiscountAmount(200, { type: "fixed", fixed: 500 }), 200);
});

test("tax and service apply after discount", () => {
  const totals = calculatePosTotals({
    subtotal: 1000,
    taxPercent: 5,
    serviceChargePercent: 10,
    discountType: "percent",
    discountPercent: 10,
  });
  assert.equal(totals.discountAmount, 100);
  assert.equal(totals.taxableBase, 900);
  assert.equal(totals.taxAmount, 45);
  assert.equal(totals.serviceCharge, 90);
  assert.equal(totals.total, 1035);
});

test("resolvePosDiscountInput respects enable flag", () => {
  assert.deepEqual(resolvePosDiscountInput(false, "percent", "10"), {
    discountType: "none",
    discountPercent: 0,
    discountFixed: 0,
  });
  assert.deepEqual(resolvePosDiscountInput(true, "percent", "10"), {
    discountType: "percent",
    discountPercent: 10,
    discountFixed: 0,
  });
});
