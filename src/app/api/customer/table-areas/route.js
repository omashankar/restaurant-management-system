import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);

    const filter = restaurantId ? { restaurantId } : {};

    const areas = await db
      .collection("tableAreas")
      .find(filter)
      .project({ name: 1, imageUrl: 1 })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(100)
      .toArray();

    return Response.json({
      success: true,
      areas: areas
        .filter((a) => a?.name)
        .map((a) => ({
          name: a.name,
          imageUrl: a.imageUrl ?? "",
        })),
    });
  } catch (err) {
    console.error("customer.table-areas.GET failed:", err.message);
    return Response.json({ success: false, areas: [] }, { status: 200 });
  }
}
