import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

async function getPublicRestaurantId(db) {
  const envRestaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID?.trim();
  if (envRestaurantId) {
    try {
      return new ObjectId(envRestaurantId);
    } catch {
      // ignore malformed env and fallback to active restaurant
    }
  }
  const restaurant = await db.collection("restaurants").findOne(
    { status: "active" },
    { sort: { createdAt: 1 }, projection: { _id: 1 } }
  );
  return restaurant?._id ?? null;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getPublicRestaurantId(db);
    if (!restaurantId) {
      return Response.json({
        success: true,
        meta: {
          taxPercentage: 8,
          deliveryCharge: 0,
          etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
          coupons: [],
        },
      });
    }

    const settingsDoc = await db.collection("restaurant_settings").findOne(
      { restaurantId },
      { projection: { pos: 1 } }
    );
    const taxPercentage = Number(settingsDoc?.pos?.taxPercentage ?? 8);
    const serviceCharge = Number(settingsDoc?.pos?.serviceCharge ?? 0);

    return Response.json({
      success: true,
      meta: {
        taxPercentage: Number.isFinite(taxPercentage) ? Math.max(0, taxPercentage) : 8,
        deliveryCharge: Number.isFinite(serviceCharge) ? Math.max(0, serviceCharge) : 0,
        etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
        coupons: [
          { code: "SAVE10", label: "Save 10% up to $10", type: "percent", value: 10, maxDiscount: 10 },
          { code: "FLAT5", label: "Flat $5 off on $30+", type: "flat", value: 5, minSubtotal: 30 },
        ],
      },
    });
  } catch {
    return Response.json(
      { success: false, error: "Failed to load checkout metadata." },
      { status: 500 }
    );
  }
}
