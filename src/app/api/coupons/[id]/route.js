import { parseCouponInput, serializeCouponAdmin } from "@/lib/couponUtils";
import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function getFilter(tenantFilter, id) {
  try {
    return { ...tenantFilter, _id: new ObjectId(id) };
  } catch {
    return null;
  }
}

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, restaurantId }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    const parsed = parseCouponInput(body);
    if (!parsed.ok) {
      return Response.json({ success: false, error: parsed.errors[0] }, { status: 400 });
    }

    const duplicate = await db.collection("coupons").findOne({
      restaurantId,
      code: parsed.data.code,
      _id: { $ne: filter._id },
    });
    if (duplicate) {
      return Response.json({ success: false, error: "Coupon code already exists." }, { status: 409 });
    }

    await db.collection("coupons").updateOne(filter, {
      $set: { ...parsed.data, updatedAt: new Date() },
    });

    const updated = await db.collection("coupons").findOne(filter);
    return Response.json({ success: true, coupon: serializeCouponAdmin(updated) });
  },
);

export const DELETE = withTenant(["admin"], async ({ db, tenantFilter }, request, { params }) => {
  const filter = getFilter(tenantFilter, params.id);
  if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  await db.collection("coupons").deleteOne(filter);
  return Response.json({ success: true });
});
