import test from "node:test";
import assert from "node:assert/strict";
import {
  orderCreateSchema,
  customerCheckoutSchema,
  parseSchema,
} from "../src/lib/validationSchemas.js";

test("orderCreateSchema accepts valid payload", () => {
  const data = parseSchema(orderCreateSchema, {
    items: [{ name: "Burger", qty: 2, price: 9.5 }],
    orderType: "dine-in",
    tableNumber: "T1",
    customer: "Alex",
  });
  assert.equal(data.orderType, "dine-in");
  assert.equal(data.items.length, 1);
});

test("orderCreateSchema rejects invalid orderType", () => {
  assert.throws(
    () => parseSchema(orderCreateSchema, {
      items: [{ name: "Burger", qty: 2, price: 9.5 }],
      orderType: "invalid",
    }),
    /Invalid orderType/
  );
});

test("customerCheckoutSchema requires name and phone-or-email", () => {
  assert.throws(
    () => parseSchema(customerCheckoutSchema, {
      items: [{ name: "Pizza", qty: 1, price: 12 }],
      orderType: "delivery",
      customer: { name: "", phone: "", email: "" },
    }),
    /Customer name is required/
  );

  const withEmail = parseSchema(customerCheckoutSchema, {
    items: [{ name: "Pizza", qty: 1, price: 12 }],
    orderType: "takeaway",
    customer: { name: "Alex", phone: "", email: "alex@example.com" },
  });
  assert.equal(withEmail.customer.email, "alex@example.com");

  assert.throws(
    () => parseSchema(customerCheckoutSchema, {
      items: [{ name: "Pizza", qty: 1, price: 12 }],
      orderType: "takeaway",
      customer: { name: "Alex", phone: "", email: "" },
    }),
    /phone|email|contact/i
  );
});
