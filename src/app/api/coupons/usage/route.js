import { listCouponUsages } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(["admin", "manager"], async ({ db, restaurantId }, request) => {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get("page")) || 1;
  const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
  const couponCode = searchParams.get("code") ?? "";

  const result = await listCouponUsages(db, restaurantId, { page, limit, couponCode });
  return Response.json({ success: true, ...result });
});
