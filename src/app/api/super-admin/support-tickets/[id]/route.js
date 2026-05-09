import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const ALLOWED_PRIORITIES = ["low", "medium", "high", "urgent"];
const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

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

  const update = { updatedAt: new Date() };
  const updates = [];
  const status = normalizeText(body?.status, 20).toLowerCase();
  const priority = normalizeText(body?.priority, 20).toLowerCase();
  const note = normalizeText(body?.note, 300);

  if (status) {
    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
    }
    update.status = status;
    updates.push({
      at: new Date(),
      by: payload.id,
      role: payload.role,
      action: "status_changed",
      note: `Status changed to ${status} by super admin`,
    });
  }

  if (priority) {
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return Response.json({ success: false, error: "Invalid priority." }, { status: 400 });
    }
    update.priority = priority;
    updates.push({
      at: new Date(),
      by: payload.id,
      role: payload.role,
      action: "priority_changed",
      note: `Priority changed to ${priority} by super admin`,
    });
  }

  if (note) {
    updates.push({
      at: new Date(),
      by: payload.id,
      role: payload.role,
      action: "comment",
      note,
    });
  }

  if (Object.keys(update).length === 1 && updates.length === 0) {
    return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const pushOps = {};
    if (updates.length) pushOps.updates = { $each: updates };

    const ticket = await db.collection("support_tickets").findOneAndUpdate(
      { _id },
      {
        $set: update,
        ...(Object.keys(pushOps).length ? { $push: pushOps } : {}),
      },
      { returnDocument: "after" }
    );

    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found." }, { status: 404 });
    }
    return Response.json({ success: true, ticket });
  } catch (err) {
    console.error("super-admin.support-tickets.PATCH failed:", err.message);
    return Response.json(
      { success: false, error: "Failed to update support ticket." },
      { status: 500 }
    );
  }
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
    const ticket = await db.collection("support_tickets").findOne({ _id });
    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found." }, { status: 404 });
    }
    const restaurant = await db
      .collection("restaurants")
      .findOne({ _id: ticket.restaurantId }, { projection: { name: 1 } });
    return Response.json({
      success: true,
      ticket: {
        ...ticket,
        restaurantName: restaurant?.name || "Unknown Restaurant",
      },
    });
  } catch (err) {
    console.error("super-admin.support-tickets.GET failed:", err.message);
    return Response.json(
      { success: false, error: "Failed to load support ticket." },
      { status: 500 }
    );
  }
}
