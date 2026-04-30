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
const VALID_PLANS = ["free", "starter", "pro", "enterprise"];

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
  if (body.plan) {
    if (!VALID_PLANS.includes(body.plan)) {
      return Response.json({ success: false, error: "Invalid plan." }, { status: 400 });
    }
    update.plan = body.plan;
  }
  if (body.name)    update.name    = body.name.trim();
  if (body.phone   != null) update.phone   = body.phone.trim();
  if (body.address != null) update.address = body.address.trim();
  update.updatedAt = new Date();
  if (Object.keys(update).length === 1) {
    return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    const session = client.startSession();
    try {
      let notFound = false;
      await session.withTransaction(async () => {
        const result = await db.collection("restaurants").updateOne({ _id }, { $set: update }, { session });
        if (result.matchedCount === 0) {
          notFound = true;
          return;
        }

        // If disabling restaurant, also deactivate its users
        if (body.status === "inactive" || body.status === "suspended") {
          await db.collection("users").updateMany(
            { restaurantId: _id, role: { $ne: "super_admin" } },
            { $set: { status: "inactive" } },
            { session }
          );
        }
        // If re-enabling, reactivate users
        if (body.status === "active") {
          await db.collection("users").updateMany(
            { restaurantId: _id, role: { $ne: "super_admin" } },
            { $set: { status: "active" } },
            { session }
          );
        }
      });
      if (notFound) {
        return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
      }
    } finally {
      await session.endSession();
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

    const session = client.startSession();
    let notFound = false;
    try {
      await session.withTransaction(async () => {
        const result = await db.collection("restaurants").deleteOne({ _id }, { session });
        if (result.deletedCount === 0) {
          notFound = true;
          return;
        }
        // Remove all users belonging to this restaurant
        await db.collection("users").deleteMany({ restaurantId: _id }, { session });
      });
      if (notFound) {
        return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
      }
    } finally {
      await session.endSession();
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
