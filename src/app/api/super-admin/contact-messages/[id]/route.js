import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import { ObjectId } from "mongodb";

const ALLOWED_STATUSES = ["new", "read", "replied", "archived"];

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function toOid(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function normalizeText(value, max = 300) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();
  return ALLOWED_STATUSES.includes(value) ? value : "new";
}

async function loadMessage(db, _id, markRead = false) {
  const col = db.collection("contact_messages");
  const doc = await col.findOne({ _id });
  if (!doc) return null;

  const currentStatus = normalizeStatus(doc.status);
  if (markRead && currentStatus === "new") {
    await col.updateOne({ _id }, { $set: { status: "read", updatedAt: new Date() } });
    doc.status = "read";
    doc.updatedAt = new Date();
  }

  let restaurantName = null;
  if (doc.restaurantId) {
    const restaurant = await db
      .collection("restaurants")
      .findOne({ _id: doc.restaurantId }, { projection: { name: 1 } });
    restaurantName = restaurant?.name ?? "Restaurant";
  }

  const replies = Array.isArray(doc.replies)
    ? doc.replies.map((r) => ({
        ...r,
        sentAt: r.sentAt ?? null,
      }))
    : [];

  return {
    ...doc,
    _id: String(doc._id),
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
    restaurantName,
    status: normalizeStatus(doc.status),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
    lastReplyAt: doc.lastReplyAt ?? null,
    replies,
  };
}

export async function GET(request, { params }) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db = client.db();
    const message = await loadMessage(db, _id, true);
    if (!message) {
      return Response.json({ success: false, error: "Message not found." }, { status: 404 });
    }
    return Response.json({ success: true, message });
  } catch (err) {
    console.error("super-admin.contact-messages.GET failed:", err?.message);
    return Response.json(
      { success: false, error: "Failed to load message." },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  const payload = superAdminOnly(request);
  if (!payload) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  const status = normalizeText(body?.status, 20).toLowerCase();
  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("contact_messages");

    const existing = await col.findOne({ _id });
    if (!existing) {
      return Response.json({ success: false, error: "Message not found." }, { status: 404 });
    }

    await col.updateOne({ _id }, { $set: { status, updatedAt: new Date() } });

    await writeAuditLog({
      action: "settings.updated",
      category: "settings",
      actorId: payload.id,
      targetName: `contact_message:${id}`,
      meta: { status, source: existing.source ?? null },
      ip: getClientIp(request),
    });

    const message = await loadMessage(db, _id, false);
    return Response.json({ success: true, message });
  } catch (err) {
    console.error("super-admin.contact-messages.PATCH failed:", err?.message);
    return Response.json(
      { success: false, error: "Failed to update message." },
      { status: 500 }
    );
  }
}
