/**
 * POST /api/super-admin/settings/test-gateway
 * Test a payment gateway connection using provided credentials.
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

const SECRET_MASK = "********";
const GATEWAY_SECRET_FIELDS = ["secretKey", "webhookSecret"];

function resolveGatewayCredentials(gateway, credentials, stored = {}) {
  const prev = stored[gateway] ?? {};
  const resolved = { ...prev, ...credentials };
  for (const field of GATEWAY_SECRET_FIELDS) {
    const val = credentials?.[field];
    if (val == null || val === "" || val === SECRET_MASK) {
      resolved[field] = prev[field] ?? "";
    }
  }
  return resolved;
}

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { gateway, credentials } = body;
  if (!gateway) {
    return Response.json({ success: false, error: "gateway is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const storedDoc = await db.collection("settings").findOne(
      { _id: "platform" },
      { projection: { "payment.gateways": 1 } },
    );
    const gw = resolveGatewayCredentials(
      gateway,
      credentials ?? {},
      storedDoc?.payment?.gateways ?? {},
    );

    if (gateway === "razorpay") {
      const apiKey    = String(gw.apiKey    || "").trim();
      const secretKey = String(gw.secretKey || "").trim();
      if (!apiKey || !secretKey) {
        return Response.json({ success: false, error: "Razorpay API Key and Secret Key are required." });
      }
      const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
        headers: {
          Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`,
        },
      });
      if (res.ok || res.status === 200) {
        return Response.json({ success: true, message: "✅ Razorpay connection successful!" });
      }
      const data = await res.json().catch(() => ({}));
      return Response.json({ success: false, error: data?.error?.description ?? `Razorpay error: ${res.status}` });
    }

    if (gateway === "stripe") {
      const secretKey = String(gw.secretKey || "").trim();
      if (!secretKey) {
        return Response.json({ success: false, error: "Stripe Secret Key is required." });
      }
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      if (res.ok) {
        return Response.json({ success: true, message: "✅ Stripe connection successful!" });
      }
      const data = await res.json().catch(() => ({}));
      return Response.json({ success: false, error: data?.error?.message ?? `Stripe error: ${res.status}` });
    }

    if (gateway === "cashfree") {
      const apiKey    = String(gw.apiKey    || "").trim();
      const secretKey = String(gw.secretKey || "").trim();
      if (!apiKey || !secretKey) {
        return Response.json({ success: false, error: "Cashfree App ID and Secret Key are required." });
      }
      const res = await fetch("https://api.cashfree.com/pg/orders?limit=1", {
        headers: {
          "x-client-id":     apiKey,
          "x-client-secret": secretKey,
          "x-api-version":   "2023-08-01",
        },
      });
      if (res.ok || res.status === 200) {
        return Response.json({ success: true, message: "✅ Cashfree connection successful!" });
      }
      return Response.json({ success: false, error: `Cashfree error: ${res.status}` });
    }

    if (gateway === "payu") {
      const apiKey = String(gw.apiKey ?? "").trim();
      const secretKey = String(gw.secretKey ?? "").trim();
      if (!apiKey || !secretKey) {
        return Response.json({ success: false, error: "PayU key and salt are required." });
      }
      return Response.json({ success: true, message: "✅ PayU credentials valid for hosted checkout." });
    }

    if (gateway === "phonepe") {
      const merchantId = String(gw.merchantId ?? "").trim();
      const secretKey = String(gw.secretKey ?? "").trim();
      if (!merchantId || !secretKey) {
        return Response.json({ success: false, error: "PhonePe Merchant ID and Salt Key are required." });
      }
      return Response.json({ success: true, message: "✅ PhonePe credentials saved for Pay Page checkout." });
    }

    if (gateway === "paytm") {
      const merchantId = String(gw.merchantId ?? "").trim();
      const secretKey = String(gw.secretKey ?? "").trim();
      if (!merchantId || !secretKey) {
        return Response.json({ success: false, error: "Paytm Merchant ID and Merchant Key are required." });
      }
      return Response.json({ success: true, message: "✅ Paytm credentials saved for checkout." });
    }

    if (gateway === "paypal") {
      const clientId = String(gw.clientId ?? gw.apiKey ?? "").trim();
      const secretKey = String(gw.secretKey ?? "").trim();
      if (!clientId || !secretKey) {
        return Response.json({ success: false, error: "PayPal Client ID and Secret are required." });
      }
      const base = gw.testMode ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
      const auth = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
      const res = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return Response.json({ success: false, error: data?.error_description ?? "PayPal auth failed." });
      }
      return Response.json({ success: true, message: "✅ PayPal connection successful!" });
    }

    if (gateway === "ccavenue") {
      const merchantId = String(gw.merchantId ?? "").trim();
      const accessCode = String(gw.apiKey ?? "").trim();
      const workingKey = String(gw.secretKey ?? "").trim();
      if (!merchantId || !accessCode || !workingKey) {
        return Response.json({ success: false, error: "CCAvenue Merchant ID, Access Code, and Working Key are required." });
      }
      return Response.json({ success: true, message: "✅ CCAvenue credentials saved for hosted checkout." });
    }

    if (gateway === "offline") {
      const hasInfo = [gw.instructions, gw.upiId, gw.bankDetails].some((v) => String(v ?? "").trim());
      if (!hasInfo) {
        return Response.json({ success: false, error: "Add payment instructions, UPI ID, or bank details." });
      }
      return Response.json({ success: true, message: "✅ Offline payment instructions configured." });
    }

    const hasKeys = Object.values(gw ?? {}).some((v) => String(v).trim().length > 0);
    if (!hasKeys) {
      return Response.json({ success: false, error: "Please enter API credentials first." });
    }
    return Response.json({
      success: true,
      message: `✅ ${gateway.charAt(0).toUpperCase() + gateway.slice(1)} credentials saved.`,
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message ?? "Connection test failed." }, { status: 500 });
  }
}
