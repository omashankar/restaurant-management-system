/**
 * POST /api/super-admin/settings/test-gateway
 * Test a payment gateway connection using provided credentials.
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";

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
    if (gateway === "razorpay") {
      const apiKey    = String(credentials?.apiKey    || "").trim();
      const secretKey = String(credentials?.secretKey || "").trim();
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
      const secretKey = String(credentials?.secretKey || "").trim();
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
      const apiKey    = String(credentials?.apiKey    || "").trim();
      const secretKey = String(credentials?.secretKey || "").trim();
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

    // For other gateways — just validate keys are present
    const hasKeys = Object.values(credentials ?? {}).some((v) => String(v).trim().length > 0);
    if (!hasKeys) {
      return Response.json({ success: false, error: "Please enter API credentials first." });
    }
    return Response.json({
      success: true,
      message: `✅ ${gateway.charAt(0).toUpperCase() + gateway.slice(1)} credentials saved. Live test not available for this gateway.`,
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message ?? "Connection test failed." }, { status: 500 });
  }
}
