import clientPromise from "@/lib/mongodb";
import { serializeCustomerOrderDetail } from "@/lib/customerOrderSerialize";
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

    return Response.json({
      success: true,
      order: serializeCustomerOrderDetail(order),
    });
  } catch (err) {
    console.error("customer.orders.[id].GET failed:", err.message);
    return Response.json({ success: false, error: "Failed to load order." }, { status: 500 });
  }
}
