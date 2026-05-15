import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
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
