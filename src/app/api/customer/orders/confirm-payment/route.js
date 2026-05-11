import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import {
  assertStripePaymentIntentForOrder,
  getPlatformPaymentSecrets,
  verifyRazorpayCheckoutSignature,
} from "@/lib/paymentGateway";

export async function POST(request) {
  const customerPayload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!customerPayload?.id && !customerPayload?.phone && !customerPayload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const orderId = String(body?.orderId ?? "").trim();
  const provider = String(body?.provider ?? "").trim().toLowerCase();
  if (!orderId || !provider) {
    return Response.json({ success: false, error: "orderId and provider are required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const order = await db.collection("orders").findOne({ orderId });
    if (!order) {
      return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    if (provider === "razorpay") {
      const razorpayOrderId = String(body?.razorpay_order_id ?? "").trim();
      const razorpayPaymentId = String(body?.razorpay_payment_id ?? "").trim();
      const razorpaySignature = String(body?.razorpay_signature ?? "").trim();
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return Response.json({ success: false, error: "Incomplete Razorpay payload." }, { status: 400 });
      }
      const secrets = await getPlatformPaymentSecrets(db);
      const ok = verifyRazorpayCheckoutSignature({
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature,
        secret: secrets.razorpayKeySecret,
      });
      if (!ok) {
        return Response.json({ success: false, error: "Invalid payment signature." }, { status: 400 });
      }

      await db.collection("orders").updateOne(
        { orderId },
        {
          $set: {
            "payment.status": "paid",
            "payment.gatewayProvider": "razorpay",
            "payment.gatewayOrderId": razorpayOrderId,
            "payment.gatewayPaymentId": razorpayPaymentId,
            updatedAt: new Date(),
          },
        }
      );
      return Response.json({ success: true });
    }

    if (provider === "stripe") {
      const paymentIntentId = String(body?.paymentIntentId ?? "").trim();
      if (!paymentIntentId) {
        return Response.json({ success: false, error: "paymentIntentId is required." }, { status: 400 });
      }
      try {
        await assertStripePaymentIntentForOrder(db, paymentIntentId, orderId);
      } catch (err) {
        return Response.json({ success: false, error: err.message || "Stripe verification failed." }, { status: 400 });
      }
      await db.collection("orders").updateOne(
        { orderId },
        {
          $set: {
            "payment.status": "paid",
            "payment.gatewayProvider": "stripe",
            "payment.gatewayPaymentId": paymentIntentId,
            updatedAt: new Date(),
          },
        }
      );
      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: "Unsupported provider." }, { status: 400 });
  } catch (err) {
    console.error("confirm-payment failed:", err.message);
    return Response.json({ success: false, error: "Failed to confirm payment." }, { status: 500 });
  }
}
