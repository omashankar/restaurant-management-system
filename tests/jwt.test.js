import test from "node:test";
import assert from "node:assert/strict";
import { signRefreshToken, signToken, verifyToken } from "../src/lib/jwt.js";

test("signToken produces verifiable access token", () => {
  const token = signToken({ id: "u1", role: "admin", restaurantId: "r1" });
  const payload = verifyToken(token);
  assert.equal(payload.id, "u1");
  assert.equal(payload.role, "admin");
});

test("signRefreshToken produces verifiable refresh token", () => {
  const token = signRefreshToken({ id: "u2", role: "manager", type: "refresh" });
  const payload = verifyToken(token);
  assert.equal(payload.id, "u2");
  assert.equal(payload.type, "refresh");
});
