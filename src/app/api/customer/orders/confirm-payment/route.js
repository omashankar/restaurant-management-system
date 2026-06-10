import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import {
  assertStripePaymentIntentForOrder,
  getPaymentSecrets,
  verifyRazorpayCheckoutSignature,
} from "@/lib/paymentGateway";
import { ObjectId } from "mongodb";

function customerOwnsOrder(order, payload) {
  if (!payload) return false;
  if (payload.id && order.customerAccountId) {
    try {
      if (String(order.customerAccountId) === String(new ObjectId(payload.id))) return true;
    } catch {
      /* ignore */
    }
  }
  const orderPhone = String(order.customerInfo?.phone ?? "").trim();
  const orderEmail = String(order.customerInfo?.email ?? "").trim().toLowerCase();
  if (payload.phone && orderPhone && payload.phone === orderPhone) return true;
  if (payload.email && orderEmail && String(payload.email).trim().toLowerCase() === orderEmail) {
    return true;
  }
  return false;
}

function canConfirmPayment(order, payload) {
  if (order.source !== "customer") return false;
  if (!payload?.id && !payload?.phone && !payload?.email) {
    // Guest checkout — cryptographic gateway verification is the trust boundary.
    return true;
  }
  return customerOwnsOrder(order, payload);
}

export async function POST(request) {
  const customerPayload = verifyCustomerToken(getCustomerTokenFromRequest(request));

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

    if (!canConfirmPayment(order, customerPayload)) {
      return Response.json({ success: false, error: "Not allowed to confirm this order." }, { status: 403 });
    }

    if (order.payment?.status === "paid") {
      return Response.json({ success: true });
    }

    if (order.payment?.status !== "initiated") {
      return Response.json(
        { success: false, error: "Order payment cannot be confirmed." },
        { status: 400 }
      );
    }

    if (provider === "razorpay") {
      const razorpayOrderId = String(body?.razorpay_order_id ?? "").trim();
      const razorpayPaymentId = String(body?.razorpay_payment_id ?? "").trim();
      const razorpaySignature = String(body?.razorpay_signature ?? "").trim();
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return Response.json({ success: false, error: "Incomplete Razorpay payload." }, { status: 400 });
      }
      if (
        order.payment?.gatewayOrderId &&
        razorpayOrderId !== String(order.payment.gatewayOrderId)
      ) {
        return Response.json({ success: false, error: "Payment does not match this order." }, { status: 400 });
      }
      const secrets = await getPaymentSecrets(db, order.restaurantId);
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
        await assertStripePaymentIntentForOrder(db, paymentIntentId, orderId, order.restaurantId);
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
