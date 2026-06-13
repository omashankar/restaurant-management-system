import crypto from "node:crypto";
import {
  gatewayHasCredentials,
  getGatewayConfig,
  listEnabledGateways,
  pickGatewayField,
} from "@/lib/gateways/credentials";
import { createSessionForGateway } from "@/lib/gateways/sessions";
import {
  verifyCashfreePayment,
  verifyCcAvenueReturn,
  verifyPayPalCapture,
  verifyPaytmPayment,
  verifyPayuReturn,
  verifyPhonePePayment,
  verifyRazorpayCheckoutSignature,
} from "@/lib/gateways/verify";

const EMPTY_SECRETS = {
  razorpayKeyId: "",
  razorpayKeySecret: "",
  razorpayWebhookSecret: "",
  stripeSecretKey: "",
  stripePublicKey: "",
  stripeWebhookSecret: "",
  cashfreeApiKey: "",
  cashfreeSecretKey: "",
  gateways: {},
};

function isOnlineMethod(method) {
  return ["upi", "card", "debitCard", "netBanking", "wallet", "payLater", "bankTransfer"].includes(method);
}

function plainGatewayField(gw, field) {
  const raw = String(gw?.[field] ?? "").trim();
  return raw && raw !== "********" ? raw : "";
}

async function readPlatformSettings(db) {
  const doc = await db.collection("settings").findOne(
    { _id: "platform" },
    { projection: { payment: 1, integrations: 1 } },
  );

  const gateways = { ...(doc?.payment?.gateways ?? {}) };
  const rzpGw = gateways?.razorpay ?? {};
  const stripeGw = gateways?.stripe ?? {};
  const cashfreeGw = gateways?.cashfree ?? {};

  return {
    razorpayKeyId: plainGatewayField(rzpGw, "apiKey") || String(doc?.integrations?.razorpayKeyId ?? "").trim(),
    razorpayKeySecret: plainGatewayField(rzpGw, "secretKey") || String(doc?.integrations?.razorpayKeySecret ?? "").trim(),
    razorpayWebhookSecret: plainGatewayField(rzpGw, "webhookSecret") || String(doc?.integrations?.webhookSecret ?? "").trim(),
    stripeSecretKey: plainGatewayField(stripeGw, "secretKey") || String(doc?.payment?.stripeSecretKey ?? "").trim(),
    stripePublicKey: plainGatewayField(stripeGw, "publicKey") || String(doc?.payment?.stripePublicKey ?? "").trim(),
    stripeWebhookSecret: plainGatewayField(stripeGw, "webhookSecret") || String(doc?.payment?.webhookSecret ?? "").trim(),
    cashfreeApiKey: plainGatewayField(cashfreeGw, "apiKey"),
    cashfreeSecretKey: plainGatewayField(cashfreeGw, "secretKey"),
    gateways,
  };
}

async function readRestaurantGatewaySettings(db, restaurantId) {
  if (!restaurantId) return { ...EMPTY_SECRETS };

  const doc = await db.collection("restaurant_payment_settings").findOne(
    { restaurantId },
    { projection: { gateways: 1 } },
  );
  const gateways = doc?.gateways ?? {};
  const rzp = gateways.razorpay ?? {};
  const stripe = gateways.stripe ?? {};
  const cashfree = gateways.cashfree ?? {};

  return {
    razorpayKeyId: pickGatewayField(rzp, "apiKey"),
    razorpayKeySecret: pickGatewayField(rzp, "secretKey"),
    razorpayWebhookSecret: pickGatewayField(rzp, "webhookSecret"),
    stripeSecretKey: pickGatewayField(stripe, "secretKey"),
    stripePublicKey: pickGatewayField(stripe, "publicKey"),
    stripeWebhookSecret: pickGatewayField(stripe, "webhookSecret"),
    cashfreeApiKey: pickGatewayField(cashfree, "apiKey"),
    cashfreeSecretKey: pickGatewayField(cashfree, "secretKey"),
    gateways,
  };
}

function mergePaymentSecrets(platform, restaurant) {
  const mergedGateways = { ...platform.gateways };
  for (const [id, gw] of Object.entries(restaurant.gateways ?? {})) {
    if (gw?.enabled) mergedGateways[id] = { ...mergedGateways[id], ...gw };
  }
  return {
    razorpayKeyId: restaurant.razorpayKeyId || platform.razorpayKeyId,
    razorpayKeySecret: restaurant.razorpayKeySecret || platform.razorpayKeySecret,
    razorpayWebhookSecret: restaurant.razorpayWebhookSecret || platform.razorpayWebhookSecret,
    stripeSecretKey: restaurant.stripeSecretKey || platform.stripeSecretKey,
    stripePublicKey: restaurant.stripePublicKey || platform.stripePublicKey,
    stripeWebhookSecret: restaurant.stripeWebhookSecret || platform.stripeWebhookSecret,
    cashfreeApiKey: restaurant.cashfreeApiKey || platform.cashfreeApiKey,
    cashfreeSecretKey: restaurant.cashfreeSecretKey || platform.cashfreeSecretKey,
    gateways: mergedGateways,
  };
}

/** Platform + restaurant keys (restaurant gateway wins when enabled). */
export async function getPaymentSecrets(db, restaurantId = null) {
  const platform = await readPlatformSettings(db);
  if (!restaurantId) return platform;
  const restaurant = await readRestaurantGatewaySettings(db, restaurantId);
  return mergePaymentSecrets(platform, restaurant);
}

function isConfigured(cfg) {
  return listEnabledGateways(cfg).some((g) => gatewayHasCredentials(g.id, g));
}

export async function isOnlinePaymentConfigured(db, restaurantId = null) {
  const cfg = await getPaymentSecrets(db, restaurantId);
  return isConfigured(cfg);
}

export async function createGatewayPaymentSession({
  db,
  restaurantId = null,
  amount,
  currency,
  orderId,
  method,
  customer = null,
  returnKind = "order",
}) {
  if (!isOnlineMethod(method)) return null;

  /* Subscription fees always use Super Admin platform gateways — never restaurant keys. */
  const secretsRestaurantId = returnKind === "subscription" ? null : restaurantId;
  const cfg = await getPaymentSecrets(db, secretsRestaurantId);
  const ctx = { amount, currency, orderId, method, customer, returnKind };
  const errors = [];

  for (const g of listEnabledGateways(cfg)) {
    if (g.id === "offline" && method !== "bankTransfer") continue;
    if (!gatewayHasCredentials(g.id, g)) continue;

    try {
      const session = await createSessionForGateway(g.id, g, ctx);
      if (session) return session;
    } catch (err) {
      errors.push(`${g.id}: ${err.message}`);
    }
  }

  throw new Error(
    errors.length
      ? `No payment gateway available. ${errors.join(" | ")}`
      : "No online payment gateway configured.",
  );
}

export async function verifyGatewayPayment(db, restaurantId, provider, order, body = {}, options = {}) {
  const secretsRestaurantId =
    options.platformOnly || order?.payment?.paymentType === "subscription" ? null : restaurantId;
  const cfg = await getPaymentSecrets(db, secretsRestaurantId);
  const p = String(provider ?? "").toLowerCase();

  if (p === "razorpay") {
    return verifyRazorpayCheckoutSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
      secret: cfg.razorpayKeySecret || getGatewayConfig(cfg, "razorpay").secretKey,
    });
  }
  if (p === "stripe") {
    await assertStripePaymentIntentForOrder(db, body.paymentIntentId, order.orderId, secretsRestaurantId);
    return true;
  }
  if (p === "cashfree") {
    return verifyCashfreePayment(cfg, order.orderId, order.payment?.gatewayOrderId);
  }
  if (p === "phonepe") {
    return verifyPhonePePayment(cfg, body.merchantTransactionId || order.payment?.gatewayOrderId);
  }
  if (p === "payu") {
    return verifyPayuReturn(cfg, body);
  }
  if (p === "paytm") {
    return verifyPaytmPayment(cfg, order.payment?.gatewayOrderId || order.orderId);
  }
  if (p === "paypal") {
    return verifyPayPalCapture(cfg, body.paypalOrderId || body.token || order.payment?.gatewayOrderId);
  }
  if (p === "ccavenue") {
    return verifyCcAvenueReturn(cfg, body.encResp || body.enc_response);
  }
  if (p === "offline") {
    return Boolean(order.payment?.gatewayProvider === "offline");
  }

  return false;
}

export async function assertStripePaymentIntentForOrder(
  db,
  paymentIntentId,
  expectedMetadataOrderId,
  restaurantId = null,
) {
  const cfg = await getPaymentSecrets(db, restaurantId);
  if (!cfg.stripeSecretKey) throw new Error("Stripe is not configured.");
  const id = String(paymentIntentId ?? "").trim();
  if (!id) throw new Error("Missing payment intent id.");
  const res = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${cfg.stripeSecretKey}` } },
  );
  const pi = await res.json();
  if (!res.ok) {
    throw new Error(typeof pi?.error?.message === "string" ? pi.error.message : "Stripe verification failed.");
  }
  if (pi.status !== "succeeded") throw new Error(`Payment status is "${pi.status}".`);
  if (String(pi.metadata?.orderId ?? "") !== String(expectedMetadataOrderId)) {
    throw new Error("Payment intent does not match this order.");
  }
  return pi;
}

export function verifyRazorpayWebhook(body, signature, secret) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyStripeWebhook(body, signature, secret) {
  if (!signature || !secret) return false;
  const elements = String(signature).split(",").map((v) => v.trim());
  const tsPart = elements.find((part) => part.startsWith("t="));
  const v1Part = elements.find((part) => part.startsWith("v1="));
  if (!tsPart || !v1Part) return false;
  const signedPayload = `${tsPart.slice(2)}.${body}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1Part.slice(3)));
}

export { verifyRazorpayCheckoutSignature };

/** @deprecated Use getPaymentSecrets(db, restaurantId) */
export async function getPlatformPaymentSecrets(db) {
  return readPlatformSettings(db);
}
