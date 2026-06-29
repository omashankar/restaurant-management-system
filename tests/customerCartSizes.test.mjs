import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildDetailCartLine,
  buildSizedCartLine,
  getMenuItemCartState,
} from "../src/lib/menuItemSizes.js";

test("getMenuItemCartState aggregates sized lines", () => {
  const lines = [
    { id: "m1::half", qty: 2 },
    { id: "m1::full", qty: 1 },
    { id: "m2", qty: 1 },
  ];
  assert.deepEqual(getMenuItemCartState(lines, "m1"), { qty: 3 });
  assert.equal(getMenuItemCartState(lines, "m2")?.qty, 1);
  assert.equal(getMenuItemCartState(lines, "m9"), null);
});

test("buildDetailCartLine matches menu sized id", () => {
  const item = {
    id: "burger-1",
    name: "Cheese Burger",
    price: 50,
    sizes: [{ id: "regular", label: "Regular", price: 50 }],
    image: null,
    itemType: "veg",
  };
  const line = buildDetailCartLine(item, {
    selectedSize: item.sizes[0],
    selectedAddOns: [],
    qty: 2,
  });
  assert.equal(line.id, "burger-1::regular");
  assert.equal(line.qty, 2);
  assert.equal(line.price, 50);
});

test("buildDetailCartLine add-ons extend base id", () => {
  const item = { id: "p1", name: "Pizza", price: 200, sizes: [], image: null };
  const line = buildDetailCartLine(item, {
    selectedAddOns: [{ id: "cheese", name: "Extra cheese", price: 30 }],
    qty: 1,
  });
  assert.equal(line.id, "p1::addons-cheese");
  assert.equal(line.price, 230);
});
