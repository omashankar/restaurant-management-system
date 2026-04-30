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
  const allowedStatuses = ["active", "expired", "cancelled", "trial"];

  if (body.status != null) {
    if (!allowedStatuses.includes(body.status)) {
      return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.startDate) {
    const start = new Date(body.startDate);
    if (Number.isNaN(start.getTime())) {
      return Response.json({ success: false, error: "Invalid startDate." }, { status: 400 });
    }
    update.startDate = start;
  }

  if (body.endDate) {
    const end = new Date(body.endDate);
    if (Number.isNaN(end.getTime())) {
      return Response.json({ success: false, error: "Invalid endDate." }, { status: 400 });
    }
    update.endDate = end;
    if (end > new Date()) update.status = update.status ?? "active";
  }

  if (update.startDate && update.endDate && update.endDate < update.startDate) {
    return Response.json({ success: false, error: "endDate cannot be earlier than startDate." }, { status: 400 });
  }

  if (Object.keys(update).length === 1) {
    return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
  }

  await db.collection("subscriptions").updateOne({ _id }, { $set: update });
  if (sub.restaurantId) {
    await db.collection("restaurants").updateOne(
      { _id: sub.restaurantId },
      {
        $set: {
          subscriptionStatus: update.status ?? sub.status ?? "active",
          ...(update.status === "cancelled" ? { plan: "free" } : {}),
          updatedAt: new Date(),
        },
      }
    );
  }
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
    if (sub.restaurantId) {
      await db.collection("restaurants").updateOne(
        { _id: sub.restaurantId },
        { $set: { subscriptionStatus: "cancelled", plan: "free", updatedAt: new Date() } }
      );
    }
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
