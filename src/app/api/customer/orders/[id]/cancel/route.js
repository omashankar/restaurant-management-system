import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { ObjectId } from "mongodb";

export async function POST(request, { params }) {
  const payload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  const { id } = await params;
  let oid;
  try {
    oid = new ObjectId(id);
  } catch {
    return Response.json({ success: false, error: "Invalid order id." }, { status: 400 });
  }

  const orMatch = [];
  if (payload.phone) orMatch.push({ "customerInfo.phone": payload.phone });
  if (payload.email) {
    const em = String(payload.email).trim().toLowerCase();
    if (em) orMatch.push({ "customerInfo.email": em });
  }
  if (payload.id) {
    try {
      orMatch.push({ customerAccountId: new ObjectId(payload.id) });
    } catch {
      /* ignore */
    }
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const order = await db.collection("orders").findOne({ _id: oid, $or: orMatch });
    if (!order) {
      return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    }
    if (order.status === "cancelled") {
      return Response.json({ success: true, message: "Order already cancelled." });
    }
    if (!["new", "pending"].includes(String(order.status ?? "").toLowerCase())) {
      return Response.json(
        { success: false, error: "This order can no longer be cancelled." },
        { status: 400 }
      );
    }

    await db.collection("orders").updateOne(
      { _id: oid },
      { $set: { status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() } }
    );

    if (order.orderType === "dine-in" && order.tableNumber) {
      await db.collection("tables").updateOne(
        { restaurantId: order.restaurantId, tableNumber: order.tableNumber },
        { $set: { status: "available", updatedAt: new Date() } }
      ).catch(() => {});
    }

    return Response.json({ success: true, message: "Order cancelled." });
  } catch (err) {
    console.error("customer.orders.cancel failed:", err?.message);
    return Response.json({ success: false, error: "Could not cancel order." }, { status: 500 });
  }
}
