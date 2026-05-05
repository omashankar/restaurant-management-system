import clientPromise from "@/lib/mongodb";
import { buildOrderTimeline, normalizeCustomerOrderStatus } from "@/lib/customerOrderStatus";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  const { id } = await params;
  const token = getCustomerTokenFromRequest(request);
  const payload = verifyCustomerToken(token);
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  let oid;
  try {
    oid = new ObjectId(id);
  } catch {
    return Response.json({ success: false, error: "Invalid order id." }, { status: 400 });
  }

  const orMatch = [];
  if (payload.phone) {
    orMatch.push({ "customerInfo.phone": payload.phone });
  }
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
  if (orMatch.length === 0) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const order = await db.collection("orders").findOne({
      _id: oid,
      $or: orMatch,
    });

    if (!order) {
      return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    const meta = normalizeCustomerOrderStatus(order.status);
    const items = Array.isArray(order.items) ? order.items : [];
    const lineItems = items.map((it) => {
      const price = Number(it.price ?? 0);
      const qty = Number(it.qty ?? 0);
      return {
        id: String(it.id ?? ""),
        name: String(it.name ?? ""),
        price,
        qty,
        lineTotal: Number((price * qty).toFixed(2)),
      };
    });

    const subtotal = Number(order.subtotal ?? lineItems.reduce((s, l) => s + l.lineTotal, 0));
    const tax = Number(order.tax ?? 0);
    const total = Number(order.total ?? subtotal + tax);

    return Response.json({
      success: true,
      order: {
        id: String(order._id),
        orderId: order.orderId ?? "",
        orderType: order.orderType ?? "",
        status: order.status ?? "",
        statusKey: meta.key,
        statusLabel: meta.label,
        statusEmoji: meta.emoji,
        chipClass: meta.chipClass,
        notes: order.notes ?? "",
        createdAt: order.createdAt ?? null,
        subtotal: Number(subtotal.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(total.toFixed(2)),
        items: lineItems,
        timeline: buildOrderTimeline(meta.key),
      },
    });
  } catch (err) {
    console.error("customer.orders.[id].GET failed:", err.message);
    return Response.json({ success: false, error: "Failed to load order." }, { status: 500 });
  }
}
