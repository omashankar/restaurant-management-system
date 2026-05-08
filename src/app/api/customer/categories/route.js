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
      return Response.json({ success: true, categories: [] });
    }

    const categories = await db
      .collection("categories")
      .find({ restaurantId })
      .sort({ name: 1 })
      .toArray();

    const counts = await db
      .collection("menuItems")
      .aggregate([
        { $match: { restaurantId } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ])
      .toArray();
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    return Response.json({
      success: true,
      categories: categories.map((category) => ({
        ...category,
        id: category._id.toString(),
        _id: undefined,
        itemCount: countMap[category._id.toString()] ?? 0,
      })),
    });
  } catch {
    return Response.json(
      { success: false, error: "Failed to load categories." },
      { status: 500 }
    );
  }
}
