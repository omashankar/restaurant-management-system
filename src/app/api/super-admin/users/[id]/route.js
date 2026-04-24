import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const STAFF_ROLES = ["manager", "waiter", "chef"];

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

/* ── PATCH /api/super-admin/users/:id
   Super Admin can ONLY modify restaurant admins (role === "admin").
   Attempting to modify staff → 403.
── */
export async function PATCH(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const client = await clientPromise;
  const db     = client.db();

  const target = await db.collection("users").findOne({ _id }, { projection: { role: 1 } });
  if (!target) return Response.json({ success: false, error: "User not found." }, { status: 404 });

  /* ── RBAC: block access to super_admin and all staff roles ── */
  if (target.role === "super_admin") {
    return Response.json({ success: false, error: "Cannot modify another super admin." }, { status: 403 });
  }
  if (STAFF_ROLES.includes(target.role)) {
    return Response.json(
      { success: false, error: "Super Admin cannot modify staff users. Staff is managed by their restaurant admin." },
      { status: 403 }
    );
  }

  /* Only allow status updates for admin users */
  const update = { updatedAt: new Date() };
  if (body.status && ["active", "inactive", "blocked"].includes(body.status)) {
    update.status = body.status;
  }

  const result = await db.collection("users").updateOne({ _id }, { $set: update });
  if (result.matchedCount === 0) return Response.json({ success: false, error: "User not found." }, { status: 404 });

  return Response.json({ success: true });
}

/* ── DELETE /api/super-admin/users/:id
   Super Admin can ONLY delete restaurant admins (role === "admin").
   Attempting to delete staff → 403.
── */
export async function DELETE(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    const target = await db.collection("users").findOne({ _id }, { projection: { role: 1 } });
    if (!target) return Response.json({ success: false, error: "User not found." }, { status: 404 });

    /* ── RBAC: block deletion of super_admin and all staff roles ── */
    if (target.role === "super_admin") {
      return Response.json({ success: false, error: "Cannot delete a super admin." }, { status: 403 });
    }
    if (STAFF_ROLES.includes(target.role)) {
      return Response.json(
        { success: false, error: "Super Admin cannot delete staff users. Staff is managed by their restaurant admin." },
        { status: 403 }
      );
    }

    await db.collection("users").deleteOne({ _id });
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE super-admin/users/[id] error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
