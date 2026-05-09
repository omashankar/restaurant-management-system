import { withTenant } from "@/lib/tenantDb";
import { getSubscription } from "@/lib/subscription";

export const GET = withTenant(["admin"], async ({ db, restaurantId, payload }) => {
  const plans = await db
    .collection("plans")
    .find({ isActive: { $ne: false } })
    .sort({ monthlyPrice: 1, price: 1, createdAt: 1 })
    .toArray();

  const restaurant = await db.collection("restaurants").findOne(
    { _id: restaurantId },
    { projection: { name: 1, ownerEmail: 1, plan: 1, subscriptionStatus: 1 } }
  );

  const subscription = await getSubscription(restaurantId);

  return Response.json({
    success: true,
    profile: {
      restaurantName: restaurant?.name ?? "Restaurant",
      ownerEmail: restaurant?.ownerEmail ?? payload.email ?? "",
      currentPlan: restaurant?.plan ?? subscription?.planSlug ?? "free",
      subscriptionStatus: restaurant?.subscriptionStatus ?? subscription?.status ?? "active",
    },
    subscription,
    plans: plans.map((plan) => ({
      id: plan._id.toString(),
      slug: plan.slug,
      name: plan.name,
      description: plan.description ?? "",
      monthlyPrice: Number.isFinite(Number(plan.monthlyPrice))
        ? Number(plan.monthlyPrice)
        : Number(plan.price ?? 0),
      yearlyPrice: Number.isFinite(Number(plan.yearlyPrice))
        ? Number(plan.yearlyPrice)
        : Number((Number(plan.price ?? 0) * 12).toFixed(2)),
      features: Array.isArray(plan.features) ? plan.features : [],
    })),
  });
});
