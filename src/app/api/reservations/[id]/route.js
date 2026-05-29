import { isReservationSlotAvailable } from "@/lib/reservationConflict";
import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

const ALLOWED_STATUS = ["pending", "confirmed", "completed", "cancelled"];
const PATCH_FIELDS = [
  "customerName", "phone", "date", "time", "guests",
  "tableNumber", "area", "notes", "status",
];

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const res = await db.collection("reservations").findOne({ ...tenantFilter, _id });
    if (!res) return Response.json({ success: false, error: "Reservation not found." }, { status: 404 });
    return Response.json({ success: true, reservation: { ...res, id: res._id.toString(), _id: undefined } });
  }
);

export const PATCH = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    const now = new Date();
    const update = { updatedAt: now };
    for (const key of PATCH_FIELDS) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (update.customerName) update.customerName = String(update.customerName).trim();
    if (update.phone !== undefined) update.phone = String(update.phone ?? "").trim();
    if (update.tableNumber !== undefined) update.tableNumber = String(update.tableNumber).trim() || "TBD";
    if (update.area !== undefined) update.area = String(update.area ?? "").trim();
    if (update.notes !== undefined) update.notes = String(update.notes ?? "").trim();
    if (update.status && !ALLOWED_STATUS.includes(update.status)) {
      delete update.status;
    }

    const current = await db.collection("reservations").findOne({ ...tenantFilter, _id });
    if (!current) return Response.json({ success: false, error: "Reservation not found." }, { status: 404 });

    const tableNum = update.tableNumber ?? current.tableNumber;
    const date = update.date ?? current.date;
    const time = update.time ?? current.time;
    const nextStatus = update.status ?? current.status;

    if (tableNum !== "TBD" && nextStatus !== "cancelled") {
      const existing = await db.collection("reservations")
        .find({ ...tenantFilter, date, status: { $ne: "cancelled" } })
        .toArray();
      const slot = isReservationSlotAvailable(existing, {
        tableNumber: tableNum,
        date,
        time,
        excludeId: params.id,
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

    if (update.status === "confirmed") update.confirmedAt = now;
    if (update.status === "completed") update.completedAt = now;
    if (update.status === "cancelled") update.cancelledAt = now;

    const result = await db.collection("reservations").updateOne(
      { ...tenantFilter, _id },
      { $set: update }
    );
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Reservation not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const result = await db.collection("reservations").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Reservation not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
