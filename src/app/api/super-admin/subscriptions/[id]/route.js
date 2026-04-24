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

function toOid(id) { try { return new ObjectId(id); } catch { return null; } }

export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const client = await clientPromise;
  const db     = client.db();

  const sub = await db.collection("subscriptions").findOne({ _id });
  if (!sub) return Response.json({ success: false, error: "Subscription not found." }, { status: 404 });

  const update = { updatedAt: new Date() };
  if (body.status && ["active","expired","cancelled","trial"].includes(body.status)) update.status = body.status;
  if (body.endDate) {
    update.endDate = new Date(body.endDate);
    if (new Date(body.endDate) > new Date()) update.status = update.status ?? "active";
  }
  if (body.startDate) update.startDate = new Date(body.startDate);

  await db.collection("subscriptions").updateOne({ _id }, { $set: update });
  return Response.json({ success: true });
}

export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();
    const sub = await db.collection("subscriptions").findOne({ _id });
    if (!sub) return Response.json({ success: false, error: "Subscription not found." }, { status: 404 });
    await db.collection("subscriptions").updateOne({ _id }, { $set: { status: "cancelled", updatedAt: new Date() } });
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
