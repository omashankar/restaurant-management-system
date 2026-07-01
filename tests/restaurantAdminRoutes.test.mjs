import assert from "node:assert/strict";
import test from "node:test";
import { isRestaurantAdminRoute } from "../src/lib/restaurantAdminRoutes.js";

test("coupons route keeps restaurant admin theme on client navigation", () => {
  assert.equal(isRestaurantAdminRoute("/coupons"), true);
});

test("menu sub-routes remain restaurant admin routes", () => {
  assert.equal(isRestaurantAdminRoute("/menu/items"), true);
});
