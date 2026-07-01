import {
  dedupeCouponsByCode,
  parseCouponInput,
  serializeCouponAdmin,
} from "@/lib/couponUtils";
import { seedCouponsIfEmpty, ensureCouponIndexes, attachRedemptionCounts } from "@/lib/couponDb";
import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(["admin", "manager"], async ({ db, tenantFilter, restaurantId }) => {
  await ensureCouponIndexes(db);
  await seedCouponsIfEmpty(db, restaurantId);

  const rows = await db
    .collection("coupons")
    .find(tenantFilter)
    .sort({ code: 1 })
    .toArray();

  const coupons = await attachRedemptionCounts(
    db,
    restaurantId,
    dedupeCouponsByCode(rows.map(serializeCouponAdmin)),
  );

  return Response.json({
    success: true,
    coupons,
  });
});

export const POST = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, restaurantId, payload }, request) => {
    const body = await request.json();
    const parsed = parseCouponInput(body);
    if (!parsed.ok) {
      return Response.json({ success: false, error: parsed.errors[0] }, { status: 400 });
    }

    const existing = await db.collection("coupons").findOne({
      restaurantId,
      code: parsed.data.code,
    });
    if (existing) {
      return Response.json({ success: false, error: "Coupon code already exists." }, { status: 409 });
    }

    const now = new Date();
    const doc = {
      ...tenantFilter,
      ...parsed.data,
      usedCount: 0,
      createdBy: new ObjectId(payload.id),
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("coupons").insertOne(doc);
    return Response.json(
      {
        success: true,
        coupon: serializeCouponAdmin({ ...doc, _id: result.insertedId }),
      },
      { status: 201 },
    );
  },
);
