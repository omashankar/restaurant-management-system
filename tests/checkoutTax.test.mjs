import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveCheckoutTaxPercent } from "../src/lib/checkoutTax.js";

test("uses POS tax when billing GST is default 0 without GSTIN", () => {
  assert.equal(
    resolveCheckoutTaxPercent(
      { pos: { taxPercentage: "5" } },
      { tax: { gstPercentage: "0", gstNumber: "" } },
    ),
    5,
  );
});

test("uses billing GST when GSTIN is configured", () => {
  assert.equal(
    resolveCheckoutTaxPercent(
      { pos: { taxPercentage: "5" } },
      { tax: { gstPercentage: "18", gstNumber: "22AAAAA0000A1Z5" } },
    ),
    18,
  );
});

test("uses billing GST when rate is explicitly non-zero", () => {
  assert.equal(
    resolveCheckoutTaxPercent(
      { pos: { taxPercentage: "5" } },
      { tax: { gstPercentage: "12", gstNumber: "" } },
    ),
    12,
  );
});

test("falls back to 8 when neither source is set", () => {
  assert.equal(resolveCheckoutTaxPercent({}, {}), 8);
});

test("respects explicit POS 0% when billing not configured", () => {
  assert.equal(
    resolveCheckoutTaxPercent(
      { pos: { taxPercentage: "0" } },
      { tax: { gstPercentage: "0", gstNumber: "" } },
    ),
    0,
  );
});
