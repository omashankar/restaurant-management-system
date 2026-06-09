import clientPromise from "@/lib/mongodb";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
 
/**
 * GET /api/customer/tables?status=available
 * Public endpoint for customer dine-in table selection.
 */
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
 
    const { searchParams } = new URL(request.url);
    const status = String(searchParams.get("status") ?? "available").trim();
 
    const filter = restaurantId ? { restaurantId } : {};
    if (status && status !== "all") filter.status = status;
 
    const tables = await db
      .collection("tables")
      .find(filter)
      .project({ tableNumber: 1, capacity: 1, status: 1, zone: 1, categoryId: 1 })
      .sort({ tableNumber: 1 })
      .limit(500)
      .toArray();

    return Response.json({
      success: true,
      tables: tables
        .filter((t) => t?.tableNumber)
        .map((t) => ({
          id: String(t._id),
          tableNumber: String(t.tableNumber),
          capacity: Number(t.capacity ?? 0) || 0,
          status: String(t.status ?? "available"),
          zone: String(t.zone ?? ""),
          categoryId: t.categoryId ? String(t.categoryId) : "",
        })),
    });
  } catch (err) {
    console.error("customer.tables.GET failed:", err.message);
    return Response.json({ success: false, tables: [] }, { status: 200 });
  }
}

