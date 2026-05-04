import assert from "node:assert/strict";
import { buildOrderTimeline, normalizeCustomerOrderStatus } from "../src/lib/customerOrderStatus.js";

assert.equal(normalizeCustomerOrderStatus("new").key, "pending");
assert.equal(normalizeCustomerOrderStatus("preparing").key, "preparing");
assert.equal(normalizeCustomerOrderStatus("processing").key, "preparing");
assert.equal(normalizeCustomerOrderStatus("ready").emoji, "🟢");
assert.equal(normalizeCustomerOrderStatus("cancelled").key, "cancelled");

const tl = buildOrderTimeline("preparing");
assert.equal(tl.find((s) => s.key === "preparing")?.state, "current");

console.log("customerOrderStatus tests ok");
