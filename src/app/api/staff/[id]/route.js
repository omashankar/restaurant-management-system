import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

const STAFF_ROLES = ["manager", "waiter", "chef"];
const STAFF_STATUSES = ["active", "on-leave"];

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

export const PATCH = withTenant(
  ["admin"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const body = await request.json();
    const existing = await db.collection("users").findOne(
      { ...tenantFilter, _id },
      { projection: { role: 1 } }
    );
    if (!existing) return Response.json({ success: false, error: "Staff not found." }, { status: 404 });
    if (!STAFF_ROLES.includes(existing.role)) {
      return Response.json({ success: false, error: "Only staff roles can be modified here." }, { status: 403 });
    }
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const update = {};
    if (body.name)  update.name  = body.name.trim();
    if (body.email !== undefined) {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (email && !EMAIL_RE.test(email)) {
        return Response.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
      }
      if (email) {
        const emailConflict = await db.collection("users").findOne(
          { ...tenantFilter, email, _id: { $ne: _id } },
          { projection: { _id: 1 } }
        );
        if (emailConflict) {
          return Response.json({ success: false, error: "Email is already in use by another staff member." }, { status: 409 });
        }
        update.email = email;
      }
    }
    if (body.role) {
      const nextRole = String(body.role).toLowerCase();
      if (!STAFF_ROLES.includes(nextRole)) {
        return Response.json({ success: false, error: "Role must be manager, waiter, or chef." }, { status: 400 });
      }
      update.role = nextRole;
    }
    if (body.phone)  update.phone  = body.phone.trim();
    if (body.status) {
      if (!STAFF_STATUSES.includes(body.status)) {
        return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
      }
      update.status = body.status;
    }
    update.updatedAt = new Date();
    if (Object.keys(update).length === 1) {
      return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
    }

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
  async ({ db, tenantFilter, payload }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    if (payload.id === params.id) {
      return Response.json({ success: false, error: "You cannot remove your own account." }, { status: 400 });
    }

    const existing = await db.collection("users").findOne(
      { ...tenantFilter, _id },
      { projection: { role: 1 } }
    );
    if (!existing) return Response.json({ success: false, error: "Staff not found." }, { status: 404 });
    if (!STAFF_ROLES.includes(existing.role)) {
      return Response.json({ success: false, error: "Only staff roles can be removed here." }, { status: 403 });
    }

    const result = await db.collection("users").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) return Response.json({ success: false, error: "Staff not found." }, { status: 404 });
    return Response.json({ success: true });
  }
);
