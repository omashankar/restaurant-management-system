import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { ObjectId } from "mongodb";

function buildCustomerMatch(payload) {
  const match = [];
  if (payload.phone) match.push({ "customerInfo.phone": payload.phone });
  if (payload.email) {
    const email = String(payload.email).trim().toLowerCase();
    if (email) match.push({ "customerInfo.email": email });
  }
  if (payload.id) {
    try {
      match.push({ customerAccountId: new ObjectId(payload.id) });
    } catch {
      // ignore invalid id
    }
  }
  return match;
}

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

  try {
    const client = await clientPromise;
    const db = client.db();
    const match = buildCustomerMatch(payload);
    if (match.length === 0) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const sourceOrder = await db.collection("orders").findOne({ _id: oid, $or: match });
    if (!sourceOrder) {
      return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const now = new Date();
    const items = Array.isArray(sourceOrder.items) ? sourceOrder.items : [];
    const subtotal = items.reduce((sum, item) => sum + Number(item.price ?? 0) * Number(item.qty ?? 0), 0);
    const tax = Number(sourceOrder.tax ?? 0);
    const deliveryCharge = Number(sourceOrder.deliveryCharge ?? 0);
    const total = Number((subtotal + tax + deliveryCharge).toFixed(2));
    const cloned = {
      restaurantId: sourceOrder.restaurantId,
      orderId: `ORD-C-${Date.now()}`,
      source: "customer-reorder",
      customerAccountId: sourceOrder.customerAccountId ?? null,
      orderType: sourceOrder.orderType ?? "takeaway",
      tableNumber: sourceOrder.tableNumber ?? null,
      customer: sourceOrder.customer ?? "",
      customerInfo: sourceOrder.customerInfo ?? {},
      items,
      itemCount: items.reduce((sum, item) => sum + Number(item.qty ?? 0), 0),
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      deliveryCharge: Number(deliveryCharge.toFixed(2)),
      total,
      status: "new",
      notes: sourceOrder.notes ?? "",
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection("orders").insertOne(cloned);
    return Response.json({
      success: true,
      order: { id: String(result.insertedId), orderId: cloned.orderId, total: cloned.total, status: cloned.status },
    }, { status: 201 });
  } catch (err) {
    console.error("customer.orders.reorder failed:", err.message);
    return Response.json({ success: false, error: "Failed to reorder." }, { status: 500 });
  }
}
