import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { ObjectId } from "mongodb";

export async function POST(request) {
  const payload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Please login first." }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }
  const action = String(body?.action ?? "").trim().toLowerCase();
  const tableNumber = String(body?.tableNumber ?? "").trim();
  const orderId = String(body?.orderId ?? "").trim();
  const note = String(body?.note ?? "").trim();

  if (!["call_waiter", "request_bill"].includes(action)) {
    return Response.json({ success: false, error: "Invalid action." }, { status: 400 });
  }
  if (!tableNumber) {
    return Response.json({ success: false, error: "Table number is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: false, error: "No active restaurant found." }, { status: 404 });
    }

    await db.collection("customer_dine_in_requests").insertOne({
      restaurantId,
      action,
      tableNumber,
      orderId: orderId || null,
      note: note || null,
      status: "pending",
      customer: {
        id: payload.id ?? null,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Response.json({
      success: true,
      message: action === "call_waiter" ? "Waiter has been notified." : "Bill request sent to the counter.",
    });
  } catch (err) {
    console.error("customer.dine-in-actions failed:", err.message);
    return Response.json({ success: false, error: "Could not submit request." }, { status: 500 });
  }
}
