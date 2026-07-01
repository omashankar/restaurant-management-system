import { serializeCouponAdmin } from "@/lib/couponUtils";
import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    let filter;
    try {
      filter = { ...tenantFilter, _id: new ObjectId(params.id) };
    } catch {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const body = await request.json();
    const active = body?.active === true;

    const result = await db.collection("coupons").updateOne(filter, {
      $set: { active, updatedAt: new Date() },
    });

    if (result.matchedCount === 0) {
      return Response.json({ success: false, error: "Coupon not found." }, { status: 404 });
    }

    const updated = await db.collection("coupons").findOne(filter);
    if (!updated) {
      return Response.json({ success: false, error: "Coupon not found." }, { status: 404 });
    }

    return Response.json({
      success: true,
      active: updated.active !== false,
      coupon: serializeCouponAdmin(updated),
    });
  },
);
