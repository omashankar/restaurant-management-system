import { couponsToCsvRows, dedupeCouponsByCode, serializeCouponAdmin, toCsvString } from "@/lib/couponUtils";
import { seedCouponsIfEmpty } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(["admin", "manager"], async ({ db, tenantFilter, restaurantId }) => {
  await seedCouponsIfEmpty(db, restaurantId);
  const rows = await db.collection("coupons").find(tenantFilter).sort({ code: 1 }).toArray();
  const coupons = dedupeCouponsByCode(rows.map(serializeCouponAdmin));
  const csv = toCsvString(couponsToCsvRows(coupons));

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="coupons-${Date.now()}.csv"`,
    },
  });
});
