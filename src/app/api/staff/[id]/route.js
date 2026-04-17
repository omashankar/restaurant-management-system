import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export const PATCH = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    const update = {};
    if (body.name)   update.name   = body.name.trim();
    if (body.role)   update.role   = body.role;
    if (body.phone)  update.phone  = body.phone.trim();
    if (body.status) update.status = body.status;
    update.updatedAt = new Date();

    const result = await db.collection("users").updateOne(
      { ...tenantFilter, _id },
      { $set: update }
    );
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Staff not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    const result = await db.collection("users").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Staff not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
