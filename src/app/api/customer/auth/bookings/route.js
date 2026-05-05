import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";

export async function GET(request) {
  const token = getCustomerTokenFromRequest(request);
  const payload = verifyCustomerToken(token);
  if (!payload?.id && !payload?.phone && !payload?.email) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const or = [];
    if (payload.phone) {
      or.push({ phone: payload.phone });
    }
    if (payload.email) {
      const em = String(payload.email).trim().toLowerCase();
      if (em) {
        or.push({ email: em });
        or.push({ customerEmail: em });
      }
    }
    if (or.length === 0) {
      return Response.json({ success: true, bookings: [] });
    }

    const reservations = await db.collection("reservations")
      .find({ $or: or })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return Response.json({
      success: true,
      bookings: reservations.map((r) => ({
        id: String(r._id),
        date: r.date ?? "",
        time: r.time ?? "",
        guests: Number(r.guests ?? 0),
        tableNumber: r.tableNumber ?? "",
        status: r.status ?? "",
        createdAt: r.createdAt ?? null,
      })),
    });
  } catch (err) {
    console.error("customer.auth.bookings failed:", err.message);
    return Response.json({ success: false, error: "Failed to load bookings." }, { status: 500 });
  }
}
