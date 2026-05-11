import clientPromise from "@/lib/mongodb";
import { getPlatformPaymentSecrets, verifyStripeWebhook } from "@/lib/paymentGateway";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const client = await clientPromise;
    const db = client.db();
    const secrets = await getPlatformPaymentSecrets(db);

    if (!verifyStripeWebhook(body, signature, secrets.stripeWebhookSecret)) {
      return Response.json({ success: false, error: "Invalid signature." }, { status: 400 });
    }

    const event = JSON.parse(body || "{}");
    const intent = event?.data?.object;
    const gatewayOrderId = intent?.id;
    if (!gatewayOrderId) return Response.json({ success: true });

    const paid = event?.type === "payment_intent.succeeded";
    const failed = event?.type === "payment_intent.payment_failed";
    if (!paid && !failed) return Response.json({ success: true });

    await db.collection("orders").updateOne(
      { "payment.gatewayOrderId": gatewayOrderId },
      {
        $set: {
          "payment.status": paid ? "paid" : "failed",
          updatedAt: new Date(),
        },
      }
    );
    return Response.json({ success: true });
  } catch (err) {
    console.error("stripe webhook failed:", err.message);
    return Response.json({ success: false, error: "Webhook failed." }, { status: 500 });
  }
}
