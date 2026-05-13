/**
 * PATCH /api/super-admin/restaurant-payments/[id]
 * Super admin actions: freeze, unfreeze, approve/reject payout, set commission
 */
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

export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body;

  let restaurantId;
  try { restaurantId = new ObjectId(id); } catch {
    return Response.json({ success: false, error: "Invalid id." }, { status: 400 });
  }

  const client = await clientPromise;
  const db     = client.db();

  const restaurant = await db.collection("restaurants").findOne({ _id: restaurantId });
  if (!restaurant) {
    return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
  }

  if (action === "freeze") {
    await db.collection("restaurants").updateOne(
      { _id: restaurantId },
      { $set: { paymentFrozen: true, updatedAt: new Date() } }
    );
    return Response.json({ success: true, message: "Account frozen." });
  }

  if (action === "unfreeze") {
    await db.collection("restaurants").updateOne(
      { _id: restaurantId },
      { $set: { paymentFrozen: false, updatedAt: new Date() } }
    );
    return Response.json({ success: true, message: "Account unfrozen." });
  }

  if (action === "approvePayout" || action === "rejectPayout") {
    const { payoutId, adminNote } = body;
    let _pid;
    try { _pid = new ObjectId(payoutId); } catch {
      return Response.json({ success: false, error: "Invalid payoutId." }, { status: 400 });
    }
    const payout = await db.collection("payout_requests").findOne({ _id: _pid, restaurantId });
    if (!payout) {
      return Response.json({ success: false, error: "Payout request not found." }, { status: 404 });
    }
    if (payout.status !== "pending") {
      return Response.json({ success: false, error: "Payout already processed." }, { status: 400 });
    }
    const newStatus = action === "approvePayout" ? "approved" : "rejected";
    await db.collection("payout_requests").updateOne(
      { _id: _pid },
      { $set: { status: newStatus, adminNote: String(adminNote ?? "").trim(), processedAt: new Date() } }
    );
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: "Unknown action." }, { status: 400 });
}
