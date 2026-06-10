import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";
import { ObjectId } from "mongodb";

export async function PATCH(request, { params }) {
  const payload = verifyCustomerToken(getCustomerTokenFromRequest(request));
  if (!payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Login required." }, { status: 401 });
  }

  const { id } = await params;
  let oid;
  try {
    oid = new ObjectId(id);
  } catch {
    return Response.json({ success: false, error: "Invalid booking id." }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (body?.action !== "cancel") {
    return Response.json({ success: false, error: "Unsupported action." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);

    const or = [];
    if (payload.phone) or.push({ phone: payload.phone });
    if (payload.email) {
      const em = String(payload.email).trim().toLowerCase();
      if (em) {
        or.push({ email: em });
        or.push({ customerEmail: em });
      }
    }

    const filter = { _id: oid, $or: or };
    if (restaurantId) filter.restaurantId = restaurantId;

    const booking = await db.collection("reservations").findOne(filter);
    if (!booking) {
      return Response.json({ success: false, error: "Booking not found." }, { status: 404 });
    }
    if (booking.status === "cancelled") {
      return Response.json({ success: true, message: "Booking already cancelled." });
    }
    if (booking.status === "completed") {
      return Response.json({ success: false, error: "Completed bookings cannot be cancelled." }, { status: 400 });
    }

    await db.collection("reservations").updateOne(
      { _id: oid },
      { $set: { status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() } }
    );

    return Response.json({ success: true, message: "Booking cancelled successfully." });
  } catch (err) {
    console.error("customer.reservations.[id].PATCH failed:", err?.message);
    return Response.json({ success: false, error: "Could not cancel booking." }, { status: 500 });
  }
}
