import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

function toOid(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export const PATCH = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const body = await request.json();
    const update = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string") update.name = body.name.trim();
    if (typeof body.phone === "string") update.phone = body.phone.trim();
    if (typeof body.email === "string") update.email = body.email.trim();
    if (typeof body.notes === "string") update.notes = body.notes.trim();
    if (typeof body.lastVisit === "string" || body.lastVisit === null) update.lastVisit = body.lastVisit;
    if (typeof body.visits === "number") update.visits = Math.max(0, body.visits);

    if (!Object.keys(update).length) {
      return Response.json({ success: false, error: "No fields to update." }, { status: 400 });
    }

    const result = await db.collection("customers").updateOne(
      { ...tenantFilter, _id },
      { $set: update }
    );
    if (result.matchedCount === 0) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const result = await db.collection("customers").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  }
);
