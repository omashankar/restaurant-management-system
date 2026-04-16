import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

const VALID_STATUSES = ["new", "preparing", "ready", "completed", "cancelled"];

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

/* GET /api/orders/:id */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const order = await db.collection("orders").findOne(filter);
    if (!order) return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    return Response.json({ success: true, order: { ...order, id: order._id.toString(), _id: undefined } });
  }
);

/* PATCH /api/orders/:id — update status or fields */
export const PATCH = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();

    // Validate status if provided
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      return Response.json({ success: false, error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
    }

    const update = { ...body, updatedAt: new Date() };
    // Add timestamps for status transitions
    if (body.status === "preparing") update.preparingAt = new Date();
    if (body.status === "ready")     update.readyAt     = new Date();
    if (body.status === "completed") update.completedAt = new Date();
    if (body.status === "cancelled") update.cancelledAt = new Date();

    const result = await db.collection("orders").updateOne(filter, { $set: update });
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

/* DELETE /api/orders/:id */
export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const result = await db.collection("orders").deleteOne(filter);
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Order not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
