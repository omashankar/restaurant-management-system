import clientPromise from "@/lib/mongodb";
import { isReservationSlotAvailable } from "@/lib/reservationConflict";
import { getRestaurantIdFromRequest } from "@/lib/restaurantResolver";

/**
 * GET /api/customer/reservations?date=YYYY-MM-DD — bookings for availability UI
 * POST /api/customer/reservations — public table booking (customer site)
 */
export async function GET(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: true, reservations: [] });
    }

    const { searchParams } = new URL(request.url);
    const date = String(searchParams.get("date") ?? "").trim();
    if (!date) {
      return Response.json({ success: true, reservations: [] });
    }

    const rows = await db.collection("reservations")
      .find({ restaurantId, date, status: { $ne: "cancelled" } })
      .project({ customerName: 1, phone: 1, date: 1, time: 1, guests: 1, tableNumber: 1, area: 1, status: 1 })
      .sort({ time: 1 })
      .limit(500)
      .toArray();

    return Response.json({
      success: true,
      reservations: rows.map((r) => ({
        id: r._id.toString(),
        customerName: r.customerName ?? "",
        phone: r.phone ?? "",
        date: r.date,
        time: r.time,
        guests: r.guests ?? 2,
        tableNumber: r.tableNumber ?? "TBD",
        area: r.area ?? "",
        status: r.status ?? "pending",
      })),
    });
  } catch (err) {
    console.error("customer.reservations.GET failed:", err.message);
    return Response.json({ success: true, reservations: [] });
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const restaurantId = await getRestaurantIdFromRequest(db, request);
    if (!restaurantId) {
      return Response.json({ success: false, error: "Restaurant not found." }, { status: 400 });
    }

    const body = await request.json();
    const {
      customerName,
      phone,
      date,
      time,
      guests,
      tableNumber,
      area,
      notes,
    } = body;

    if (!customerName?.trim() || !phone?.trim() || !date || !time) {
      return Response.json({
        success: false,
        error: "Name, phone, date and time are required.",
      }, { status: 400 });
    }

    const tableNum = tableNumber?.trim() || "TBD";
    const guestCount = Math.max(1, parseInt(guests, 10) || 2);

    if (tableNum !== "TBD") {
      const existing = await db.collection("reservations")
        .find({ restaurantId, date, status: { $ne: "cancelled" } })
        .toArray();
      const slot = isReservationSlotAvailable(existing, {
        tableNumber: tableNum,
        date,
        time,
      });
      if (!slot.available) {
        return Response.json({
          success: false,
          error: slot.nextAvailableTime
            ? `This table was just booked. Try ${slot.nextAvailableTime} or another table.`
            : "This table is not available for the selected time.",
        }, { status: 409 });
      }
    }

    const doc = {
      restaurantId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      date,
      time,
      guests: guestCount,
      tableNumber: tableNum,
      area: area?.trim() ?? "",
      notes: notes?.trim() ?? "",
      status: "pending",
      createdAt: new Date(),
    };

    const result = await db.collection("reservations").insertOne(doc);

    return Response.json({
      success: true,
      id: result.insertedId.toString(),
      reservation: {
        ...doc,
        id: result.insertedId.toString(),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("customer.reservations.POST failed:", err.message);
    return Response.json({ success: false, error: "Failed to create reservation." }, { status: 500 });
  }
}
