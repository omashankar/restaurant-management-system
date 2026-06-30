import { validateCouponForOrder } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";

/** POST — validate coupon for POS (staff) or preview. */
export const POST = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, restaurantId }, request) => {
    const body = await request.json();
    const code = body?.code;
    const subtotal = Number(body?.subtotal) || 0;
    const channel = body?.channel === "pos" ? "pos" : "online";
    const items = Array.isArray(body?.items) ? body.items : [];
    const itemQty = items.reduce((s, i) => s + Number(i.qty ?? 0), 0);

    const result = await validateCouponForOrder(db, restaurantId, code, subtotal, channel, {
      orderType: body?.orderType,
      paymentMethod: body?.paymentMethod,
      itemQty,
      cartItemIds: items.map((i) => String(i.itemId ?? i.id ?? "").split("::")[0]).filter(Boolean),
      deliveryCharge: Number(body?.deliveryCharge) || 0,
      hasPointsApplied: Boolean(body?.hasPointsApplied),
      hasOtherDiscount: Boolean(body?.hasOtherDiscount),
      customerId: body?.customerId ?? null,
    });
    if (!result.valid) {
      return Response.json({ success: false, error: result.error }, { status: 400 });
    }

    return Response.json({
      success: true,
      discount: result.discount,
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        label: result.coupon.label,
        type: result.coupon.type,
      },
      posDiscount: result.posDiscount,
    });
  },
);
