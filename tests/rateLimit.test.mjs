import test from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../src/lib/rateLimit.js";

test("rateLimit allows within configured max", async () => {
  const limiter = rateLimit({ windowMs: 1000, max: 2 });
  const a = await limiter.check("k1");
  const b = await limiter.check("k1");
  assert.equal(a.allowed, true);
  assert.equal(b.allowed, true);
});

test("rateLimit blocks after configured max", async () => {
  const limiter = rateLimit({ windowMs: 1000, max: 1 });
  await limiter.check("k2");
  const blocked = await limiter.check("k2");
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter >= 1);
});
