import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

/* ── PATCH /api/super-admin/restaurants/:id — update status / plan ── */
export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const update = {};
  if (body.status && ["active", "inactive", "suspended"].includes(body.status)) update.status = body.status;
  if (body.plan)   update.plan   = body.plan;
  if (body.name)   update.name   = body.name.trim();
  update.updatedAt = new Date();

  try {
    const client = await clientPromise;
    const db     = client.db();

    const result = await db.collection("restaurants").updateOne({ _id }, { $set: update });
    if (result.matchedCount === 0) {
      return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
    }

    // If disabling restaurant, also deactivate its users
    if (body.status === "inactive" || body.status === "suspended") {
      await db.collection("users").updateMany(
        { restaurantId: _id, role: { $ne: "super_admin" } },
        { $set: { status: "inactive" } }
      );
    }
    // If re-enabling, reactivate users
    if (body.status === "active") {
      await db.collection("users").updateMany(
        { restaurantId: _id, role: { $ne: "super_admin" } },
        { $set: { status: "active" } }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── DELETE /api/super-admin/restaurants/:id ── */
export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    await db.collection("restaurants").deleteOne({ _id });
    // Remove all users belonging to this restaurant
    await db.collection("users").deleteMany({ restaurantId: _id });

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
