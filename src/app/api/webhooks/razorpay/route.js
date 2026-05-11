import clientPromise from "@/lib/mongodb";
import { getPlatformPaymentSecrets, verifyRazorpayWebhook } from "@/lib/paymentGateway";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  try {
    const client = await clientPromise;
    const db = client.db();
    const secrets = await getPlatformPaymentSecrets(db);

    if (!verifyRazorpayWebhook(body, signature, secrets.razorpayWebhookSecret)) {
      return Response.json({ success: false, error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(body || "{}");
    const paymentEntity = event?.payload?.payment?.entity;
    const orderEntity = event?.payload?.order?.entity;
    const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id || null;
    if (!gatewayOrderId) return Response.json({ success: true });

    const paid = event?.event === "payment.captured";
    const failed = event?.event === "payment.failed";
    if (!paid && !failed) return Response.json({ success: true });

    await db.collection("orders").updateOne(
      { "payment.gatewayOrderId": gatewayOrderId },
      {
        $set: {
          "payment.status": paid ? "paid" : "failed",
          "payment.gatewayPaymentId": paymentEntity?.id ?? null,
          updatedAt: new Date(),
        },
      }
    );
    return Response.json({ success: true });
  } catch (err) {
    console.error("razorpay webhook failed:", err.message);
    return Response.json({ success: false, error: "Webhook failed." }, { status: 500 });
  }
}
