/**
 * POST /api/payment-settings/test-gateway
 * Tests connectivity to a payment gateway using stored credentials.
 */
import { withTenant } from "@/lib/tenantDb";
import { decryptSecret } from "@/lib/cryptoUtils";

const ALL_GATEWAYS = ["razorpay", "cashfree", "stripe", "paypal", "paytm", "phonepe", "payu", "ccavenue", "custom"];

export const POST = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const { gateway } = body;

  if (!ALL_GATEWAYS.includes(gateway)) {
    return Response.json({ success: false, error: "Invalid gateway." }, { status: 400 });
  }

  const doc = await db.collection("restaurant_payment_settings").findOne({ restaurantId });
  const gw = doc?.gateways?.[gateway];

  if (!gw?.enabled) {
    return Response.json({ success: false, error: "Gateway is not enabled." }, { status: 400 });
  }

  const apiKey    = decryptSecret(gw.apiKey);
  const secretKey = decryptSecret(gw.secretKey);

  if (!apiKey || !secretKey) {
    return Response.json({ success: false, error: "API Key and Secret Key are required." }, { status: 400 });
  }

  try {
    if (gateway === "razorpay") {
      const res = await fetch("https://api.razorpay.com/v1/payments?count=1", {
        headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}` },
      });
      if (res.status === 401) return Response.json({ success: false, error: "Invalid Razorpay credentials." });
      if (!res.ok && res.status !== 400) return Response.json({ success: false, error: `Razorpay returned ${res.status}.` });
      return Response.json({ success: true, message: "Razorpay connection successful." });
    }

    if (gateway === "cashfree") {
      const baseUrl = gw.testMode ? "https://sandbox.cashfree.com" : "https://api.cashfree.com";
      const res = await fetch(`${baseUrl}/pg/orders?limit=1`, {
        headers: { "x-client-id": apiKey, "x-client-secret": secretKey, "x-api-version": "2023-08-01" },
      });
      if (res.status === 401) return Response.json({ success: false, error: "Invalid Cashfree credentials." });
      return Response.json({ success: true, message: "Cashfree connection successful." });
    }

    if (gateway === "stripe") {
      const res = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${secretKey}` },
      });
      if (res.status === 401) return Response.json({ success: false, error: "Invalid Stripe secret key." });
      if (!res.ok) return Response.json({ success: false, error: `Stripe returned ${res.status}.` });
      return Response.json({ success: true, message: "Stripe connection successful." });
    }

    // PayPal, Paytm, PhonePe, PayU, CCAvenue, Custom — credential presence check
    return Response.json({
      success: true,
      message: `${gateway.charAt(0).toUpperCase() + gateway.slice(1)} credentials saved. Live connectivity test not available — use sandbox to verify.`,
    });
  } catch {
    return Response.json({ success: false, error: "Network error. Could not reach gateway." }, { status: 500 });
  }
});
