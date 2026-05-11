import { withTenant } from "@/lib/tenantDb";
import { createGatewayPaymentSession } from "@/lib/paymentGateway";

function normalizeBillingCycle(value) {
  return value === "yearly" ? "yearly" : "monthly";
}

function resolvePlanAmount(plan, billingCycle) {
  const monthlyPrice = Number(plan?.monthlyPrice);
  const yearlyPrice = Number(plan?.yearlyPrice);
  const legacyPrice = Number(plan?.price);
  if (billingCycle === "yearly") {
    if (Number.isFinite(yearlyPrice) && yearlyPrice >= 0) return yearlyPrice;
    if (Number.isFinite(legacyPrice) && legacyPrice >= 0) return legacyPrice;
    if (Number.isFinite(monthlyPrice) && monthlyPrice >= 0) return Number((monthlyPrice * 12).toFixed(2));
  }
  if (Number.isFinite(monthlyPrice) && monthlyPrice >= 0) return monthlyPrice;
  if (Number.isFinite(legacyPrice) && legacyPrice >= 0) return legacyPrice;
  if (Number.isFinite(yearlyPrice) && yearlyPrice >= 0) return Number((yearlyPrice / 12).toFixed(2));
  return 0;
}

export const POST = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const planSlug = String(body?.planSlug ?? "").trim().toLowerCase();
  const billingCycle = normalizeBillingCycle(body?.billingCycle);
  const method = String(body?.method ?? "upi").trim();

  if (!planSlug) {
    return Response.json({ success: false, error: "planSlug is required." }, { status: 400 });
  }

  const plan = await db.collection("plans").findOne({
    slug: planSlug,
    isActive: { $ne: false },
  });
  if (!plan) {
    return Response.json({ success: false, error: "Selected plan not found." }, { status: 404 });
  }

  const amount = resolvePlanAmount(plan, billingCycle);
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json(
      { success: false, error: "Free plan does not require payment. Ask super admin to assign it." },
      { status: 400 }
    );
  }

  const restaurant = await db.collection("restaurants").findOne(
    { _id: restaurantId },
    { projection: { name: 1, ownerEmail: 1 } }
  );

  const invoiceId = `SUB-${Date.now()}`;
  const payment = await db.collection("payments").insertOne({
    restaurantId,
    restaurantName: restaurant?.name ?? "Restaurant",
    adminEmail: restaurant?.ownerEmail ?? "",
    plan: plan.slug,
    planName: plan.name,
    billingCycle,
    amount,
    currency: "INR",
    method,
    status: "pending",
    invoiceId,
    paymentType: "subscription",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    const gateway = await createGatewayPaymentSession({
      db,
      amount,
      currency: "INR",
      orderId: payment.insertedId.toString(),
      method,
    });

    await db.collection("payments").updateOne(
      { _id: payment.insertedId },
      {
        $set: {
          gatewayProvider: gateway?.provider ?? null,
          gatewayOrderId: gateway?.providerOrderId ?? null,
          gatewayMeta: gateway?.checkout ?? null,
          updatedAt: new Date(),
        },
      }
    );

    return Response.json({
      success: true,
      paymentId: payment.insertedId.toString(),
      invoiceId,
      amount,
      currency: "INR",
      gatewayProvider: gateway?.provider ?? null,
      checkout: gateway?.checkout ?? null,
    });
  } catch (error) {
    await db.collection("payments").updateOne(
      { _id: payment.insertedId },
      {
        $set: {
          status: "failed",
          failureReason: error.message || "Failed to initialize gateway checkout.",
          updatedAt: new Date(),
        },
      }
    );
    return Response.json({ success: false, error: error.message }, { status: 400 });
  }
});
