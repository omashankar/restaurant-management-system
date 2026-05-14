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

const META_API_VERSION = "v19.0";
const META_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

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
      return { token: doc.token, phoneNumberId: doc.phoneNumberId };
    }
  }
  const token       = process.env.WHATSAPP_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_ID?.trim();
  if (token && phoneNumberId) return { token, phoneNumberId };
  return null;
}

/**
 * Replace {variable} placeholders in a template string.
 */
export function interpolate(template, vars = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

/**
 * Send a plain-text WhatsApp message to a phone number.
 * @param {{ to: string, message: string, db?: object, restaurantId?: object }} params
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export async function sendWhatsAppMessage({ to, message, db, restaurantId }) {
  const creds = await resolveCredentials(db, restaurantId);
  if (!creds) {
    return { success: false, error: "WhatsApp not configured. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to .env" };
  }

  // Normalize phone — must be E.164 format without +
  const phone = String(to).replace(/\D/g, "");
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
 * Send order-event WhatsApp message using stored template.
 * @param {{ event: string, order: object, db: object, restaurantId: object, restaurantName?: string }} params
 */
export async function sendOrderWhatsApp({ event, order, db, restaurantId, restaurantName = "Restaurant" }) {
  const settings = await getWhatsAppSettings(db, restaurantId);
  if (!settings?.enabled) return { success: false, error: "WhatsApp disabled." };

  const templateConfig = settings.templates?.[event];
  if (!templateConfig?.enabled) return { success: false, error: "Template disabled." };

  const phone = order.customerInfo?.phone;
  if (!phone) return { success: false, error: "No customer phone." };

  const vars = {
    customer_name:   order.customerInfo?.name ?? "Customer",
    order_id:        order.orderId ?? "—",
    restaurant_name: restaurantName,
    amount:          String(order.total ?? 0),
    eta:             order.orderType === "dine-in" ? "15-20" : order.orderType === "delivery" ? "30-45" : "20-30",
    order_type:      order.orderType ?? "—",
    customer_phone:  phone,
    invoice_link:    "",
    tracking_link:   "",
    feedback_link:   "",
    item_name:       "",
    quantity:        "",
    unit:            "",
  };

  const message = interpolate(templateConfig.message, vars);
  return sendWhatsAppMessage({ to: phone, message, db, restaurantId });
}
