/**
 * GET  /api/whatsapp-settings  — load WhatsApp settings for restaurant
 * PATCH /api/whatsapp-settings — save WhatsApp settings
 */
import { withTenant } from "@/lib/tenantDb";
import { encryptSecret, decryptSecret, isSecretMask, maskSecret } from "@/lib/cryptoUtils";

const DEFAULT_TEMPLATES = {
  order_confirmed:  { enabled: true,  message: "Hi {customer_name}! Your order #{order_id} has been confirmed at {restaurant_name}. Estimated time: {eta} mins. Thank you! 🙏" },
  order_preparing:  { enabled: true,  message: "Hi {customer_name}! Your order #{order_id} is being prepared. We'll notify you when it's ready! 🍽️" },
  out_for_delivery: { enabled: true,  message: "Hi {customer_name}! Your order #{order_id} is out for delivery. Expected arrival: {eta} mins." },
  order_delivered:  { enabled: true,  message: "Hi {customer_name}! Your order #{order_id} has been delivered. Enjoy your meal! ⭐" },
  payment_received: { enabled: true,  message: "Hi {customer_name}! Payment of ₹{amount} received for order #{order_id}. Thank you!" },
  new_order_alert:  { enabled: false, message: "New order #{order_id} received! Type: {order_type}. Amount: ₹{amount}. Customer: {customer_name} ({customer_phone})" },
  low_stock:        { enabled: false, message: "Low stock alert! {item_name} is running low ({quantity} {unit} remaining). Please reorder soon." },
};

/* ── GET ── */
export const GET = withTenant(["admin"], async ({ db, restaurantId }) => {
  const doc = await db.collection("restaurant_whatsapp_settings").findOne({ restaurantId });

  const settings = {
    enabled:       Boolean(doc?.enabled ?? false),
    token:         doc?.token ? maskSecret(decryptSecret(doc.token)) : "",
    phoneNumberId: doc?.phoneNumberId ?? "",
    templates:     { ...DEFAULT_TEMPLATES, ...(doc?.templates ?? {}) },
  };

  return Response.json({ success: true, settings });
});

/* ── PATCH ── */
export const PATCH = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const existing = await db.collection("restaurant_whatsapp_settings").findOne({ restaurantId });

  const update = {
    enabled:       Boolean(body.enabled ?? existing?.enabled ?? false),
    phoneNumberId: String(body.phoneNumberId ?? existing?.phoneNumberId ?? "").trim(),
    updatedAt:     new Date(),
  };

  // Token: encrypt if new value, keep existing if mask sent
  const incomingToken = body.token;
  if (isSecretMask(incomingToken)) {
    update.token = existing?.token ?? "";
  } else if (incomingToken) {
    update.token = encryptSecret(String(incomingToken).trim());
  } else {
    update.token = "";
  }

  // Templates
  if (body.templates && typeof body.templates === "object") {
    const merged = { ...DEFAULT_TEMPLATES, ...(existing?.templates ?? {}) };
    for (const [key, val] of Object.entries(body.templates)) {
      if (merged[key] !== undefined) {
        merged[key] = {
          enabled: Boolean(val.enabled ?? merged[key].enabled),
          message: String(val.message ?? merged[key].message).trim(),
        };
      }
    }
    update.templates = merged;
  } else {
    update.templates = existing?.templates ?? DEFAULT_TEMPLATES;
  }

  await db.collection("restaurant_whatsapp_settings").updateOne(
    { restaurantId },
    { $set: update },
    { upsert: true }
  );

  return Response.json({ success: true });
});
