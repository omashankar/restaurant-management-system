/**
 * WhatsApp Business API (Meta Cloud API) service.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 *
 * Env vars needed:
 *   WHATSAPP_TOKEN      — permanent system user token from Meta
 *   WHATSAPP_PHONE_ID   — Phone Number ID from Meta dashboard
 *
 * Per-restaurant overrides are stored in restaurant_whatsapp_settings collection.
 */

import { decryptSecret } from "@/lib/cryptoUtils";

const META_API_VERSION = "v19.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

/** Normalize to E.164 digits without + (defaults 10-digit IN numbers to 91 prefix). */
export function normalizeWhatsAppPhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;
  return digits;
}

/**
 * Resolve WhatsApp credentials for a restaurant.
 * Priority: restaurant settings → env vars
 */
async function resolveCredentials(db, restaurantId) {
  if (db && restaurantId) {
    const doc = await db
      .collection("restaurant_whatsapp_settings")
      .findOne({ restaurantId });
    if (doc?.enabled && doc?.token && doc?.phoneNumberId) {
      const token = decryptSecret(doc.token) || String(doc.token).trim();
      if (token) {
        return { token, phoneNumberId: String(doc.phoneNumberId).trim() };
      }
    }
  }
  const token = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID?.trim();
  if (token && phoneNumberId) return { token, phoneNumberId };
  return null;
}

async function getRestaurantAlertPhone(db, restaurantId, whatsappSettings) {
  const override = String(whatsappSettings?.alertPhone ?? "").trim();
  if (override) return override;
  const doc = await db.collection("restaurant_settings").findOne(
    { restaurantId },
    { projection: { "contact.phoneNumber": 1 } }
  ).catch(() => null);
  return doc?.contact?.phoneNumber ?? null;
}

/**
 * Replace {variable} placeholders in a template string.
 */
export function interpolate(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

function buildOrderVars(order, restaurantName = "Restaurant") {
  return {
    customer_name: order.customerInfo?.name ?? order.customer ?? "Customer",
    order_id: order.orderId ?? "—",
    restaurant_name: restaurantName,
    amount: String(order.total ?? 0),
    eta: order.orderType === "dine-in" ? "15-20" : order.orderType === "delivery" ? "30-45" : "20-30",
    order_type: order.orderType ?? "—",
    customer_phone: order.customerInfo?.phone ?? "",
    invoice_link: "",
    tracking_link: "",
    feedback_link: "",
    item_name: "",
    quantity: "",
    unit: "",
  };
}

/**
 * Send a plain-text WhatsApp message to a phone number.
 * @param {{ to: string, message: string, db?: object, restaurantId?: object }} params
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendWhatsAppMessage({ to, message, db, restaurantId }) {
  const creds = await resolveCredentials(db, restaurantId);
  if (!creds) {
    return { success: false, error: "WhatsApp not configured. Save API Token and Phone Number ID, or set WHATSAPP_TOKEN in .env." };
  }

  const phone = normalizeWhatsAppPhone(to);
  if (!phone || phone.length < 7) {
    return { success: false, error: "Invalid phone number." };
  }

  try {
    const res = await fetch(`${META_BASE}/${creds.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${creds.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: phone,
        type: "text",
        text: { preview_url: false, body: message },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg = data?.error?.message ?? `Meta API error ${res.status}`;
      console.error("WhatsApp send failed:", errMsg);
      return { success: false, error: errMsg };
    }

    const messageId = data?.messages?.[0]?.id ?? null;
    return { success: true, messageId };
  } catch (err) {
    console.error("WhatsApp network error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Load WhatsApp settings for a restaurant from DB.
 * Returns null if not configured.
 */
export async function getWhatsAppSettings(db, restaurantId) {
  if (!db || !restaurantId) return null;
  return db.collection("restaurant_whatsapp_settings").findOne({ restaurantId });
}

/**
 * Send a templated message to a specific phone (customer or staff).
 */
export async function sendTemplateWhatsApp({ event, to, vars = {}, db, restaurantId }) {
  const settings = await getWhatsAppSettings(db, restaurantId);
  if (!settings?.enabled) return { success: false, error: "WhatsApp disabled." };

  const templateConfig = settings.templates?.[event];
  if (!templateConfig?.enabled) return { success: false, error: "Template disabled." };

  const phone = String(to ?? "").trim();
  if (!phone) return { success: false, error: "No recipient phone." };

  const message = interpolate(templateConfig.message, vars);
  return sendWhatsAppMessage({ to: phone, message, db, restaurantId });
}

/**
 * Send order-event WhatsApp message to the customer using stored template.
 */
export async function sendOrderWhatsApp({ event, order, db, restaurantId, restaurantName = "Restaurant" }) {
  const phone = order.customerInfo?.phone;
  if (!phone) return { success: false, error: "No customer phone." };

  return sendTemplateWhatsApp({
    event,
    to: phone,
    vars: buildOrderVars(order, restaurantName),
    db,
    restaurantId,
  });
}

/**
 * Send alert to restaurant owner/manager (new order, low stock, etc.).
 */
export async function sendRestaurantAlertWhatsApp({ event, vars = {}, db, restaurantId }) {
  const settings = await getWhatsAppSettings(db, restaurantId);
  if (!settings?.enabled) return { success: false, error: "WhatsApp disabled." };

  const alertPhone = await getRestaurantAlertPhone(db, restaurantId, settings);
  if (!alertPhone) {
    return { success: false, error: "No alert phone. Set it below or in Settings → Contact." };
  }

  return sendTemplateWhatsApp({ event, to: alertPhone, vars, db, restaurantId });
}

/** Map order status + type to WhatsApp template event (null = skip). */
export function getOrderStatusWhatsAppEvent(status, orderType) {
  if (status === "preparing") return "order_preparing";
  if (status === "ready" && orderType === "delivery") return "out_for_delivery";
  if (status === "completed") return "order_delivered";
  return null;
}

/**
 * Notify restaurant of a new order (POS or online).
 */
export async function sendNewOrderAlertWhatsApp({ order, db, restaurantId, restaurantName = "Restaurant" }) {
  return sendRestaurantAlertWhatsApp({
    event: "new_order_alert",
    vars: buildOrderVars(order, restaurantName),
    db,
    restaurantId,
  });
}

/**
 * Notify restaurant when inventory drops to/below reorder level.
 */
export async function sendLowStockAlertWhatsApp({ item, db, restaurantId }) {
  return sendRestaurantAlertWhatsApp({
    event: "low_stock",
    vars: {
      item_name: item.name ?? "Item",
      quantity: String(item.quantity ?? 0),
      unit: item.unit ?? "unit",
    },
    db,
    restaurantId,
  });
}
