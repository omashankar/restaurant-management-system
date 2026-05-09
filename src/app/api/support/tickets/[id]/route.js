import { withTenant } from "@/lib/tenantDb";
import { ObjectId } from "mongodb";

const ALLOWED_PRIORITIES = ["low", "medium", "high", "urgent"];
const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

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

export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, restaurantId }, _request, { params }) => {
    const { id } = params;
    const _id = toOid(id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    const ticket = await db
      .collection("support_tickets")
      .findOne({ _id, restaurantId });
    if (!ticket) {
      return Response.json({ success: false, error: "Ticket not found." }, { status: 404 });
    }
    return Response.json({ success: true, ticket });
  }
);

export const PATCH = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, payload, restaurantId }, request, { params }) => {
    const { id } = params;
    const _id = toOid(id);
    if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }

    const update = {};
    const updates = [];
    const nextStatus = normalizeText(body?.status, 20).toLowerCase();
    const nextPriority = normalizeText(body?.priority, 20).toLowerCase();
    const note = normalizeText(body?.note, 300);
    const canModerate = payload.role === "admin" || payload.role === "manager";

    if (nextStatus) {
      if (!canModerate) {
        return Response.json(
          { success: false, error: "Only admin/manager can change status." },
          { status: 403 }
        );
      }
      if (!ALLOWED_STATUSES.includes(nextStatus)) {
        return Response.json({ success: false, error: "Invalid status." }, { status: 400 });
      }
      update.status = nextStatus;
      updates.push({
        at: new Date(),
        by: payload.id,
        role: payload.role,
        action: "status_changed",
        note: `Status changed to ${nextStatus}`,
      });
    }

    if (nextPriority) {
      if (!canModerate) {
        return Response.json(
          { success: false, error: "Only admin/manager can change priority." },
          { status: 403 }
        );
      }
      if (!ALLOWED_PRIORITIES.includes(nextPriority)) {
        return Response.json({ success: false, error: "Invalid priority." }, { status: 400 });
      }
      update.priority = nextPriority;
      updates.push({
        at: new Date(),
        by: payload.id,
        role: payload.role,
        action: "priority_changed",
        note: `Priority changed to ${nextPriority}`,
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

    if (!Object.keys(update).length && updates.length === 0) {
      return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
    }
    update.updatedAt = new Date();

    const pushOps = {};
    if (updates.length) pushOps.updates = { $each: updates };

    const result = await db.collection("support_tickets").findOneAndUpdate(
      { _id, restaurantId },
      {
        $set: update,
        ...(Object.keys(pushOps).length ? { $push: pushOps } : {}),
      },
      { returnDocument: "after" }
    );
    if (!result) {
      return Response.json({ success: false, error: "Ticket not found." }, { status: 404 });
    }
    return Response.json({ success: true, ticket: result });
  }
);
