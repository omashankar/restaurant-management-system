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

/* ── PATCH /api/super-admin/plans/:id ── */
export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const update = { updatedAt: new Date() };
  if (body.name)         { update.name = body.name.trim(); update.slug = body.name.trim().toLowerCase().replace(/\s+/g, "-"); }
  if (body.price != null) update.price = Number(body.price);
  if (body.billingCycle)  update.billingCycle = body.billingCycle;
  if (body.description != null) update.description = body.description.trim();
  if (Array.isArray(body.features)) update.features = body.features;
  if (body.limits)        update.limits = body.limits;
  if (body.isActive != null) update.isActive = Boolean(body.isActive);

  try {
    const client = await clientPromise;
    const db     = client.db();
    const result = await db.collection("plans").updateOne({ _id }, { $set: update });
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Plan not found." }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── DELETE /api/super-admin/plans/:id ── */
export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    // Check if any restaurant uses this plan
    const plan = await db.collection("plans").findOne({ _id }, { projection: { slug: 1 } });
    if (!plan) return Response.json({ success: false, error: "Plan not found." }, { status: 404 });

    const inUse = await db.collection("restaurants").countDocuments({ plan: plan.slug });
    if (inUse > 0) {
      return Response.json({
        success: false,
        error: `Cannot delete — ${inUse} restaurant${inUse > 1 ? "s" : ""} use this plan.`,
      }, { status: 409 });
    }

    await db.collection("plans").deleteOne({ _id });
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
