import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request) => {
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
    const body = await request.json();
    const { customerName, phone, date, time, guests, tableNumber, notes } = body;
    if (!customerName || !date || !time) return Response.json({ success: false, error: "customerName, date and time are required." }, { status: 400 });
    const doc = { ...tenantFilter, customerName, phone: phone ?? "", date, time, guests: guests ?? 2, tableNumber: tableNumber ?? "TBD", notes: notes ?? "", status: "pending", createdBy: new ObjectId(payload.id), createdAt: new Date() };
    const result = await db.collection("reservations").insertOne(doc);
    return Response.json({ success: true, id: result.insertedId.toString() }, { status: 201 });
  }
);
