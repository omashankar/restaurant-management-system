import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export const PATCH = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    const update = { ...body, updatedAt: new Date() };
    if (body.quantity != null) update.quantity = Number(body.quantity);

    const result = await db.collection("inventory").updateOne(
      { ...tenantFilter, _id },
      { $set: update }
    );
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Item not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const result = await db.collection("inventory").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Item not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
