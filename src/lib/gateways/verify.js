import crypto from "node:crypto";
import { getGatewayConfig } from "@/lib/gateways/credentials";

function cashfreeHost(testMode) {
  return testMode ? "https://sandbox.cashfree.com" : "https://api.cashfree.com";
}

function phonePeHost(testMode) {
  return testMode
    ? "https://api-preprod.phonepe.com/apis/hermes"
    : "https://api.phonepe.com/apis/hermes";
}

function paytmHost(testMode) {
  return testMode ? "https://securegw-stage.paytm.in" : "https://securegw.paytm.in";
}

function payPalHost(testMode) {
  return testMode ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}

function decryptCcAvenue(encText, workingKey) {
  const m = crypto.createHash("md5").update(workingKey).digest();
  const iv = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f]);
  const decipher = crypto.createDecipheriv("aes-128-cbc", m, iv);
  let decrypted = decipher.update(encText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function getPayPalAccessToken(g) {
  const clientId = g.clientId || g.apiKey;
  const auth = Buffer.from(`${clientId}:${g.secretKey}`).toString("base64");
  const res = await fetch(`${payPalHost(g.testMode)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || "PayPal auth failed.");
  return data.access_token;
}

export function verifyRazorpayCheckoutSignature({ orderId, paymentId, signature, secret }) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function verifyCashfreePayment(cfg, orderId, gatewayOrderId) {
  const g = getGatewayConfig(cfg, "cashfree");
  const id = gatewayOrderId || orderId;
  const res = await fetch(`${cashfreeHost(g.testMode)}/pg/orders/${encodeURIComponent(id)}`, {
    headers: {
      "x-client-id": g.apiKey,
      "x-client-secret": g.secretKey,
      "x-api-version": "2023-08-01",
    },
  });
  const data = await res.json();
  const status = String(data?.order_status ?? "").toUpperCase();
  return res.ok && ["PAID", "SUCCESS"].includes(status);
}

export async function verifyPhonePePayment(cfg, merchantTransactionId) {
  const g = getGatewayConfig(cfg, "phonepe");
  const path = `/pg/v1/status/${g.merchantId}/${merchantTransactionId}`;
  const checksum = `${crypto.createHash("sha256").update(path + g.secretKey).digest("hex")}###${g.apiKey || "1"}`;
  const res = await fetch(`${phonePeHost(g.testMode)}${path}`, {
    headers: { "Content-Type": "application/json", "X-VERIFY": checksum, "X-MERCHANT-ID": g.merchantId },
  });
  const data = await res.json();
  const state = String(data?.data?.state ?? data?.code ?? "").toUpperCase();
  return data?.success === true && state === "COMPLETED";
}

export function verifyPayuReturn(cfg, params) {
  const g = getGatewayConfig(cfg, "payu");
  const status = String(params?.status ?? "").toLowerCase();
  if (status !== "success") return false;
  const hash = String(params?.hash ?? "");
  const salt = g.secretKey;
  const reverseSeq = `${salt}|${params?.status}|||||||||${params?.udf2 ?? ""}|${params?.udf1 ?? ""}|${params?.email}|${params?.firstname}|${params?.productinfo}|${params?.amount}|${params?.txnid}|${g.apiKey}`;
  const expected = crypto.createHash("sha512").update(reverseSeq).digest("hex");
  return hash === expected;
}

export async function verifyPaytmPayment(cfg, orderId) {
  const g = getGatewayConfig(cfg, "paytm");
  const body = {
    mid: g.merchantId,
    orderId: String(orderId).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30),
  };
  const bodyStr = JSON.stringify(body);
  const checksum = crypto.createHash("sha256").update(bodyStr + g.secretKey).digest("hex");
  const res = await fetch(`${paytmHost(g.testMode)}/v3/order/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, head: { signature: checksum } }),
  });
  const data = await res.json();
  return data?.body?.resultInfo?.resultStatus === "TXN_SUCCESS";
}

export async function verifyPayPalCapture(cfg, paypalOrderId) {
  const g = getGatewayConfig(cfg, "paypal");
  const token = await getPayPalAccessToken(g);
  const captureRes = await fetch(
    `${payPalHost(g.testMode)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    },
  );
  const data = await captureRes.json();
  const status = data?.status ?? data?.purchase_units?.[0]?.payments?.captures?.[0]?.status;
  return captureRes.ok && String(status).toUpperCase() === "COMPLETED";
}

export function verifyCcAvenueReturn(cfg, encResp) {
  const g = getGatewayConfig(cfg, "ccavenue");
  if (!encResp) return false;
  const plain = decryptCcAvenue(String(encResp), g.secretKey);
  const params = new URLSearchParams(plain);
  const status = String(params.get("order_status") ?? "").toLowerCase();
  return status === "success";
}
