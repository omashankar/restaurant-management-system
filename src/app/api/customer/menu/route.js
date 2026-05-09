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

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getPublicRestaurantId(db);
    if (!restaurantId) {
      return Response.json({ success: true, items: [] });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");

    const filter = { restaurantId };
    if (categoryId) filter.categoryId = categoryId;
    if (status && status !== "all") filter.status = status;

    const rawLimit = parseInt(searchParams.get("limit") ?? "500", 10);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(rawLimit, 1), 2000)
      : 500;

    const items = await db
      .collection("menuItems")
      .find(filter)
      .sort({ categoryName: 1, name: 1 })
      .limit(limit)
      .toArray();

    return Response.json({
      success: true,
      items: items.map((item) => ({
        ...item,
        id: item._id.toString(),
        _id: undefined,
      })),
    });
  } catch {
    return Response.json(
      { success: false, error: "Failed to load menu." },
      { status: 500 }
    );
  }
}
