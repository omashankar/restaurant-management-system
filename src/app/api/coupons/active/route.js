import { ensureCouponIndexes, listActiveCouponsForChannel, seedCouponsIfEmpty } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";

/** GET — active coupons for POS dropdown or staff preview (waiter-safe). */
export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, restaurantId }, request) => {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel") === "pos" ? "pos" : "online";

    await ensureCouponIndexes(db);
    await seedCouponsIfEmpty(db, restaurantId);
    const coupons = await listActiveCouponsForChannel(db, restaurantId, channel);

    return Response.json({ success: true, coupons });
  },
);
