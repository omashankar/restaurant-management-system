import { getCouponStats } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(["admin", "manager"], async ({ db, restaurantId }) => {
  const stats = await getCouponStats(db, restaurantId);
  return Response.json({ success: true, stats });
});
