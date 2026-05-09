import { ObjectId } from "mongodb";
import { withTenant } from "@/lib/tenantDb";
import { getPlatformPaymentSecrets, verifyRazorpayCheckoutSignature } from "@/lib/paymentGateway";

function addCycle(startDate, billingCycle) {
  const endDate = new Date(startDate);
  if (billingCycle === "yearly") endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);
  return endDate;
}

export const POST = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const paymentId = String(body?.paymentId ?? "").trim();
  const provider = String(body?.provider ?? "razorpay").trim();

  if (!paymentId) {
    return Response.json({ success: false, error: "paymentId is required." }, { status: 400 });
  }
  if (provider !== "razorpay") {
    return Response.json({ success: false, error: "Only Razorpay confirmation is supported right now." }, { status: 400 });
  }

  let _id;
  try {
    _id = new ObjectId(paymentId);
  } catch {
    return Response.json({ success: false, error: "Invalid paymentId." }, { status: 400 });
  }

  const payment = await db.collection("payments").findOne({
    _id,
    restaurantId,
    paymentType: "subscription",
  });
  if (!payment) {
    return Response.json({ success: false, error: "Payment not found." }, { status: 404 });
  }
  if (payment.status === "paid") {
    return Response.json({ success: true, message: "Payment already confirmed." });
  }

  const cfg = await getPlatformPaymentSecrets(db);
  const valid = verifyRazorpayCheckoutSignature({
    orderId: body?.razorpay_order_id,
    paymentId: body?.razorpay_payment_id,
    signature: body?.razorpay_signature,
    secret: cfg.razorpayKeySecret,
  });
  if (!valid) {
    await db.collection("payments").updateOne(
      { _id },
      { $set: { status: "failed", failureReason: "Signature mismatch.", updatedAt: new Date() } }
    );
    return Response.json({ success: false, error: "Invalid payment signature." }, { status: 400 });
  }

  const plan = await db.collection("plans").findOne({ slug: payment.plan });
  if (!plan) {
    return Response.json({ success: false, error: "Plan not found." }, { status: 404 });
  }

  const now = new Date();
  const endDate = addCycle(now, payment.billingCycle || "monthly");
  await db.collection("subscriptions").findOneAndUpdate(
    { restaurantId },
    {
      $set: {
        restaurantId,
        planId: plan._id,
        planSlug: plan.slug,
        planName: plan.name,
        limits: plan.limits ?? {},
        features: plan.features ?? [],
        price: Number(payment.amount ?? 0),
        billingCycle: payment.billingCycle || "monthly",
        startDate: now,
        endDate,
        trialEnd: null,
        status: "active",
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  await db.collection("restaurants").updateOne(
    { _id: restaurantId },
    {
      $set: {
        plan: plan.slug,
        subscriptionStatus: "active",
        planAssignedAt: now,
        updatedAt: now,
      },
    }
  );

  await db.collection("payments").updateOne(
    { _id },
    {
      $set: {
        status: "paid",
        gatewayProvider: "razorpay",
        gatewayPaymentId: body?.razorpay_payment_id ?? null,
        gatewayOrderId: body?.razorpay_order_id ?? payment.gatewayOrderId ?? null,
        paidAt: now,
        updatedAt: now,
      },
    }
  );

  return Response.json({
    success: true,
    subscription: {
      planSlug: plan.slug,
      planName: plan.name,
      status: "active",
      startDate: now,
      endDate,
    },
  });
});
