import clientPromise from "@/lib/mongodb";
import { normalizeCustomerOrderStatus } from "@/lib/customerOrderStatus";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

/**
 * Public order lookup by human-readable orderId (e.g. ORD-C-…) for success page.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = String(searchParams.get("orderId") ?? "").trim();
    if (!orderId) {
      return Response.json({ success: false, error: "Order ID required." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);

    const filter = { orderId };
    if (restaurantId) filter.restaurantId = restaurantId;

    const order = await db.collection("orders").findOne(filter, {
      projection: {
        orderId: 1,
        orderType: 1,
        status: 1,
        total: 1,
        createdAt: 1,
        restaurantId: 1,
      },
    });

    if (!order) {
      return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const meta = normalizeCustomerOrderStatus(order.status);
    const settingsDoc = restaurantId
      ? await db.collection("restaurant_settings").findOne(
          { restaurantId },
          { projection: { pos: 1 } }
        )
      : null;

    const etaDefaults = { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" };
    const etaMinutes = settingsDoc?.pos?.etaMinutes ?? etaDefaults;
    const orderType = order.orderType ?? "takeaway";

    return Response.json({
      success: true,
      order: {
        orderId: order.orderId,
        orderType,
        total: Number(order.total ?? 0),
        status: order.status,
        statusKey: meta.key,
        statusLabel: meta.label,
        statusEmoji: meta.emoji,
        createdAt: order.createdAt ?? null,
        etaLabel: etaMinutes[orderType] ?? etaMinutes.takeaway ?? "20-30",
      },
    });
  } catch (err) {
    console.error("customer.orders.track.GET failed:", err?.message);
    return Response.json({ success: false, error: "Could not load order." }, { status: 500 });
  }
}
