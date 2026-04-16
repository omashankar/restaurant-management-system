import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

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
    const now  = new Date();
    const update = { ...body, updatedAt: now };

    // Status timestamps
    if (body.status === "confirmed")  update.confirmedAt  = now;
    if (body.status === "completed")  update.completedAt  = now;
    if (body.status === "cancelled")  update.cancelledAt  = now;

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
