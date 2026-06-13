import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { getPaymentSecrets, verifyGatewayPayment } from "@/lib/paymentGateway";
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
  if (!payload?.id && !payload?.phone && !payload?.email) return true;
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

    if (provider === "offline") {
      if (order.payment?.gatewayProvider !== "offline") {
        return Response.json({ success: false, error: "Offline payment not available for this order." }, { status: 400 });
      }
      await db.collection("orders").updateOne(
        { orderId },
        {
          $set: {
            "payment.status": "pending",
            "payment.gatewayProvider": "offline",
            "payment.offlineAcknowledgedAt": new Date(),
            updatedAt: new Date(),
          },
        },
      );
      return Response.json({ success: true, pending: true });
    }

    if (order.payment?.status !== "initiated") {
      return Response.json(
        { success: false, error: "Order payment cannot be confirmed." },
        { status: 400 },
      );
    }

    const ok = await verifyGatewayPayment(db, order.restaurantId, provider, order, body);
    if (!ok) {
      return Response.json({ success: false, error: "Payment verification failed." }, { status: 400 });
    }

    const paymentId =
      body.razorpay_payment_id ||
      body.paymentIntentId ||
      body.merchantTransactionId ||
      body.txnid ||
      body.paypalOrderId ||
      body.token ||
      order.payment?.gatewayOrderId ||
      null;

    await db.collection("orders").updateOne(
      { orderId },
      {
        $set: {
          "payment.status": "paid",
          "payment.gatewayProvider": provider,
          "payment.gatewayPaymentId": paymentId,
          updatedAt: new Date(),
        },
      },
    );
    return Response.json({ success: true });
  } catch (err) {
    console.error("confirm-payment failed:", err.message);
    return Response.json({ success: false, error: err.message || "Failed to confirm payment." }, { status: 500 });
  }
}
