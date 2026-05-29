import { isReservationSlotAvailable } from "@/lib/reservationConflict";
import { withTenant } from "@/lib/tenantDb";
import { assertPlatformFeatureForPath } from "@/lib/platformFeatureGuard";
import { ObjectId } from "mongodb";

const ALLOWED_STATUS = ["pending", "confirmed", "completed", "cancelled"];

export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request) => {
    const blocked = await assertPlatformFeatureForPath("/api/reservations", db);
    if (blocked) return blocked;
    const { searchParams } = new URL(request.url);
    const date   = searchParams.get("date");
    const status = searchParams.get("status");
    const filter = { ...tenantFilter };
    if (date)   filter.date   = date;
    if (status && status !== "all") filter.status = status;

    const rawLimit = parseInt(searchParams.get("limit") ?? "500", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 2000) : 500;

    const rows = await db.collection("reservations")
      .find(filter)
      .sort({ date: 1, time: 1 })
      .limit(limit)
      .toArray();
    return Response.json({ success: true, reservations: rows.map((r) => ({ ...r, id: r._id.toString(), _id: undefined })) });
  }
);

export const POST = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter, payload }, request) => {
    const blocked = await assertPlatformFeatureForPath("/api/reservations", db);
    if (blocked) return blocked;

    const body = await request.json();
    const { customerName, phone, date, time, guests, tableNumber, notes, area, status } = body;
    if (!customerName?.trim() || !date || !time) {
      return Response.json({ success: false, error: "customerName, date and time are required." }, { status: 400 });
    }
    const tableNum = tableNumber?.trim() || "TBD";
    const statusVal = ALLOWED_STATUS.includes(status) ? status : "pending";

    if (tableNum !== "TBD") {
      const existing = await db.collection("reservations")
        .find({ ...tenantFilter, date, status: { $ne: "cancelled" } })
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
            ? `Table is already booked. Next free slot: ${slot.nextAvailableTime}`
            : "Table is already booked for this time.",
        }, { status: 409 });
      }
    }

    const doc = {
      ...tenantFilter,
      customerName: customerName.trim(),
      phone: phone?.trim() ?? "",
      date,
      time,
      guests: guests ?? 2,
      tableNumber: tableNum,
      area: area?.trim() ?? "",
      notes: notes?.trim() ?? "",
      status: statusVal,
      createdBy: new ObjectId(payload.id),
      createdAt: new Date(),
    };
    const result = await db.collection("reservations").insertOne(doc);
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  }
);
