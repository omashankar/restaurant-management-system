import { withTenant } from "@/lib/tenantDb";

const ALLOWED_PRIORITIES = ["low", "medium", "high", "urgent"];
const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

function normalizeText(value, max = 1000) {
  return String(value ?? "").trim().slice(0, max);
}

function buildTicketCode() {
  const now = new Date();
  const year = now.getFullYear();
  const chunk = String(Date.now()).slice(-6);
  return `TKT-${year}-${chunk}`;
}

export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, restaurantId }, request) => {
    const { searchParams } = new URL(request.url);
    const status = normalizeText(searchParams.get("status"), 20).toLowerCase();
    const priority = normalizeText(searchParams.get("priority"), 20).toLowerCase();
    const q = normalizeText(searchParams.get("q"), 80);
    const limitRaw = Number(searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, limitRaw)) : 50;

    const query = { restaurantId };
    if (ALLOWED_STATUSES.includes(status)) query.status = status;
    if (ALLOWED_PRIORITIES.includes(priority)) query.priority = priority;
    if (q) {
      query.$or = [
        { ticketCode: { $regex: q, $options: "i" } },
        { subject: { $regex: q, $options: "i" } },
        { message: { $regex: q, $options: "i" } },
      ];
    }

    try {
      const tickets = await db
        .collection("support_tickets")
        .find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit)
        .toArray();
      return Response.json({ success: true, tickets });
    } catch (err) {
      console.error("support.tickets.GET failed:", err.message);
      return Response.json(
        { success: false, error: "Failed to load support tickets." },
        { status: 500 }
      );
    }
  }
);

export const POST = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, payload, restaurantId }, request) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }

    const subject = normalizeText(body?.subject, 140);
    const message = normalizeText(body?.message, 4000);
    const priority = normalizeText(body?.priority || "medium", 20).toLowerCase();

    if (!subject) {
      return Response.json({ success: false, error: "Subject is required." }, { status: 400 });
    }
    if (!message) {
      return Response.json({ success: false, error: "Message is required." }, { status: 400 });
    }
    if (!ALLOWED_PRIORITIES.includes(priority)) {
      return Response.json({ success: false, error: "Invalid priority." }, { status: 400 });
    }

    const now = new Date();
    const doc = {
      ticketCode: buildTicketCode(),
      restaurantId,
      status: "open",
      priority,
      subject,
      message,
      createdBy: {
        userId: payload.id,
        role: payload.role,
      },
      updates: [
        {
          at: now,
          by: payload.id,
          role: payload.role,
          action: "created",
          note: "Ticket created",
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const result = await db.collection("support_tickets").insertOne(doc);
      await db.collection("platform_messages").insertOne({
        role: "super_admin",
        title: `Support ticket raised (${doc.ticketCode})`,
        body: `${subject} [${priority}]`,
        meta: {
          ticketId: result.insertedId,
          ticketCode: doc.ticketCode,
          restaurantId,
        },
        createdAt: now,
      });
      return Response.json({
        success: true,
        ticket: { ...doc, _id: result.insertedId },
      });
    } catch (err) {
      console.error("support.tickets.POST failed:", err.message);
      return Response.json(
        { success: false, error: "Failed to create support ticket." },
        { status: 500 }
      );
    }
  }
);
