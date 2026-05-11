import crypto from "node:crypto";

function toLowerCurrency(value) {
  return String(value || "USD").trim().toLowerCase();
}

function toMinorUnits(amount) {
  return Math.max(0, Math.round(Number(amount || 0) * 100));
}

function isOnlineMethod(method) {
  return ["upi", "card", "netBanking", "wallet", "payLater", "bankTransfer"].includes(method);
}

async function readPlatformSettings(db) {
  const doc = await db.collection("settings").findOne(
    { _id: "platform" },
    { projection: { payment: 1, integrations: 1 } }
  );
  return {
    stripeSecretKey: String(doc?.payment?.stripeSecretKey || "").trim(),
    stripePublicKey: String(doc?.payment?.stripePublicKey || "").trim(),
    stripeWebhookSecret: String(doc?.payment?.webhookSecret || "").trim(),
    razorpayKeyId: String(doc?.integrations?.razorpayKeyId || "").trim(),
    razorpayKeySecret: String(doc?.integrations?.razorpayKeySecret || "").trim(),
    razorpayWebhookSecret: String(doc?.integrations?.webhookSecret || "").trim(),
  };
}

export async function createGatewayPaymentSession({
  db,
  amount,
  currency,
  orderId,
  method,
}) {
  if (!isOnlineMethod(method)) return null;

  const cfg = await readPlatformSettings(db);
  const ccy = toLowerCurrency(currency);
  const minor = toMinorUnits(amount);

  // Prefer Razorpay when configured (good fit for INR/UPI), fallback to Stripe.
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

/**
 * Fetch PaymentIntent from Stripe and verify it succeeded for metadata.orderId.
 * @param {import("mongodb").Db} db
 */
export async function assertStripePaymentIntentForOrder(db, paymentIntentId, expectedMetadataOrderId) {
  const cfg = await readPlatformSettings(db);
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

export async function getPlatformPaymentSecrets(db) {
  return readPlatformSettings(db);
}
