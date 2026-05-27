import crypto from "node:crypto";
import { decryptSecret, isSecretMask } from "@/lib/cryptoUtils";

function toLowerCurrency(value) {
  return String(value || "USD").trim().toLowerCase();
}

function toMinorUnits(amount) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function isOnlineMethod(method) {
  return ["upi", "card", "debitCard", "netBanking", "wallet", "payLater", "bankTransfer"].includes(method);
}

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

function pickGatewayField(gw, field) {
  if (!gw?.enabled) return "";
  const raw = String(gw[field] ?? "").trim();
  if (!raw) return "";
  if (isSecretMask(raw)) return "";
  const decrypted = decryptSecret(raw);
  if (decrypted) return decrypted;
  // Legacy plaintext in DB (not yet encrypted)
  if (field === "apiKey" && /^rzp_|^pk_|^CF_/i.test(raw)) return raw;
  if (field === "secretKey" && raw.length >= 8 && !/^•/.test(raw)) return raw;
  return "";
}

async function readPlatformSettings(db) {
  const doc = await db.collection("settings").findOne(
    { _id: "platform" },
    { projection: { payment: 1, integrations: 1 } }
  );

  const gateways = doc?.payment?.gateways ?? {};
  const rzpGw = gateways?.razorpay ?? {};
  const razorpayKeyId = String(rzpGw.apiKey || doc?.integrations?.razorpayKeyId || "").trim();
  const razorpayKeySecret = String(rzpGw.secretKey || doc?.integrations?.razorpayKeySecret || "").trim();
  const razorpayWebhookSecret = String(rzpGw.webhookSecret || doc?.integrations?.webhookSecret || "").trim();

  const stripeGw = gateways?.stripe ?? {};
  const stripeSecretKey = String(stripeGw.secretKey || doc?.payment?.stripeSecretKey || "").trim();
  const stripePublicKey = String(stripeGw.publicKey || doc?.payment?.stripePublicKey || "").trim();
  const stripeWebhookSecret = String(stripeGw.webhookSecret || doc?.payment?.webhookSecret || "").trim();

  const cashfreeGw = gateways?.cashfree ?? {};
  const cashfreeApiKey = String(cashfreeGw.apiKey || "").trim();
  const cashfreeSecretKey = String(cashfreeGw.secretKey || "").trim();

  return {
    razorpayKeyId,
    razorpayKeySecret,
    razorpayWebhookSecret,
    stripeSecretKey,
    stripePublicKey,
    stripeWebhookSecret,
    cashfreeApiKey,
    cashfreeSecretKey,
    gateways,
  };
}

/** Restaurant admin → Settings → Payments (encrypted keys). */
async function readRestaurantGatewaySettings(db, restaurantId) {
  if (!restaurantId) return { ...EMPTY_SECRETS };

  const doc = await db.collection("restaurant_payment_settings").findOne(
    { restaurantId },
    { projection: { gateways: 1 } }
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
  return {
    razorpayKeyId: restaurant.razorpayKeyId || platform.razorpayKeyId,
    razorpayKeySecret: restaurant.razorpayKeySecret || platform.razorpayKeySecret,
    razorpayWebhookSecret: restaurant.razorpayWebhookSecret || platform.razorpayWebhookSecret,
    stripeSecretKey: restaurant.stripeSecretKey || platform.stripeSecretKey,
    stripePublicKey: restaurant.stripePublicKey || platform.stripePublicKey,
    stripeWebhookSecret: restaurant.stripeWebhookSecret || platform.stripeWebhookSecret,
    cashfreeApiKey: restaurant.cashfreeApiKey || platform.cashfreeApiKey,
    cashfreeSecretKey: restaurant.cashfreeSecretKey || platform.cashfreeSecretKey,
    gateways: { ...platform.gateways, ...restaurant.gateways },
  };
}

/** Platform + restaurant keys (restaurant Settings → Payment Gateway wins when enabled). */
export async function getPaymentSecrets(db, restaurantId = null) {
  const platform = await readPlatformSettings(db);
  if (!restaurantId) return platform;
  const restaurant = await readRestaurantGatewaySettings(db, restaurantId);
  return mergePaymentSecrets(platform, restaurant);
}

function isConfigured(cfg) {
  return Boolean(
    (cfg.razorpayKeyId && cfg.razorpayKeySecret) ||
    cfg.stripeSecretKey ||
    (cfg.cashfreeApiKey && cfg.cashfreeSecretKey)
  );
}

/** True if customer online methods (card/UPI/…) can create a gateway session. */
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
}) {
  if (!isOnlineMethod(method)) return null;

  const cfg = await getPaymentSecrets(db, restaurantId);
  const ccy = toLowerCurrency(currency);
  const minor = toMinorUnits(amount);

  if (cfg.razorpayKeyId && cfg.razorpayKeySecret) {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${cfg.razorpayKeyId}:${cfg.razorpayKeySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: minor,
        currency: String(currency || "INR").toUpperCase(),
        receipt: String(orderId).slice(0, 40),
        notes: { orderId, method },
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Razorpay order failed: ${txt || res.status}`);
    }
    const data = await res.json();
    return {
      provider: "razorpay",
      providerOrderId: data.id,
      amountMinor: minor,
      currency: String(currency || "INR").toUpperCase(),
      keyId: cfg.razorpayKeyId,
      checkout: {
        orderId: data.id,
        key: cfg.razorpayKeyId,
        amount: minor,
        currency: String(currency || "INR").toUpperCase(),
      },
    };
  }

  if (cfg.stripeSecretKey) {
    const form = new URLSearchParams();
    form.set("amount", String(minor));
    form.set("currency", ccy);
    form.set("automatic_payment_methods[enabled]", "true");
    form.set("metadata[orderId]", String(orderId));
    form.set("metadata[method]", String(method));
    const res = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Stripe payment intent failed: ${txt || res.status}`);
    }
    const data = await res.json();
    return {
      provider: "stripe",
      providerOrderId: data.id,
      amountMinor: minor,
      currency: ccy,
      key: cfg.stripePublicKey || "",
      checkout: {
        clientSecret: data.client_secret,
        paymentIntentId: data.id,
        publishableKey: cfg.stripePublicKey || "",
      },
    };
  }

  throw new Error("No online payment gateway configured.");
}

export async function assertStripePaymentIntentForOrder(
  db,
  paymentIntentId,
  expectedMetadataOrderId,
  restaurantId = null
) {
  const cfg = await getPaymentSecrets(db, restaurantId);
  if (!cfg.stripeSecretKey) {
    throw new Error("Stripe is not configured.");
  }
  const id = String(paymentIntentId ?? "").trim();
  if (!id) {
    throw new Error("Missing payment intent id.");
  }
  const res = await fetch(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${cfg.stripeSecretKey}` } }
  );
  const pi = await res.json();
  if (!res.ok) {
    const msg = typeof pi?.error?.message === "string" ? pi.error.message : "Stripe verification failed.";
    throw new Error(msg);
  }
  if (pi.status !== "succeeded") {
    throw new Error(`Payment status is "${pi.status}".`);
  }
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

export function verifyRazorpayCheckoutSignature({
  orderId,
  paymentId,
  signature,
  secret,
}) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyStripeWebhook(body, signature, secret) {
  if (!signature || !secret) return false;
  const elements = String(signature).split(",").map((v) => v.trim());
  const tsPart = elements.find((p) => p.startsWith("t="));
  const v1Part = elements.find((p) => p.startsWith("v1="));
  if (!tsPart || !v1Part) return false;
  const ts = tsPart.slice(2);
  const signedPayload = `${ts}.${body}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1Part.slice(3)));
}

/** @deprecated Use getPaymentSecrets(db, restaurantId) */
export async function getPlatformPaymentSecrets(db) {
  return readPlatformSettings(db);
}
