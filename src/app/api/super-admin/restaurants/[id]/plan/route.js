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

/* ── PATCH /api/super-admin/restaurants/:id/plan — assign plan ── */
export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  let _id;
  try { _id = new ObjectId(id); } catch { return Response.json({ success: false, error: "Invalid ID." }, { status: 400 }); }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { plan } = body;
  if (!plan?.trim()) return Response.json({ success: false, error: "Plan slug is required." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    // Verify plan exists
    const planDoc = await db.collection("plans").findOne({ slug: plan.trim() });
    if (!planDoc) return Response.json({ success: false, error: "Plan not found." }, { status: 404 });

    const result = await db.collection("restaurants").updateOne(
      { _id },
      { $set: { plan: plan.trim(), planAssignedAt: new Date(), updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });

    return Response.json({ success: true, plan: plan.trim() });
  } catch (err) {
    console.error("Assign plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
