import { duplicateCoupon } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, restaurantId, payload }, request, { params }) => {
    let id;
    try {
      id = new ObjectId(params.id);
    } catch {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const duplicate = await duplicateCoupon(db, restaurantId, id.toString(), payload.id);
    if (!duplicate) {
      return Response.json({ success: false, error: "Coupon not found." }, { status: 404 });
    }

    return Response.json({ success: true, coupon: duplicate }, { status: 201 });
  },
);
