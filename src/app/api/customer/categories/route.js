import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
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
