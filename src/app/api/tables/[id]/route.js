import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function getFilter(tenantFilter, id) {
  try { return { ...tenantFilter, _id: new ObjectId(id) }; }
  catch { return null; }
}

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    if (body.tableNumber) body.tableNumber = body.tableNumber.trim().toUpperCase();

    const result = await db.collection("tables").updateOne(filter, {
      $set: { ...body, updatedAt: new Date() },
    });

    if (result.matchedCount === 0) return Response.json({ success: false, error: "Table not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const filter = getFilter(tenantFilter, params.id);
    if (!filter) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const result = await db.collection("tables").deleteOne(filter);
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Table not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
