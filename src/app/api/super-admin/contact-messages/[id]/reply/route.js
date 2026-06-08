import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { sendContactInquiryReply } from "@/lib/emailService";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { contactReplyLimiter, getClientIp } from "@/lib/rateLimit";
import { ObjectId } from "mongodb";

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

function normalizeText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function serializeReplies(replies = []) {
  return replies.map((r) => ({
    ...r,
    sentAt: r.sentAt ?? null,
  }));
}

export async function POST(request, { params }) {
  const payload = superAdminOnly(request);
  if (!payload) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const limit = await contactReplyLimiter.check(`contact-reply:${payload.id ?? ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: "Too many replies sent. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 3600) } }
    );
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

  const message = normalizeText(body?.message, 5000);
  const subject = normalizeText(body?.subject, 200);

  if (message.length < 5) {
    return Response.json(
      { success: false, error: "Reply must be at least 5 characters." },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("contact_messages");

    const existing = await col.findOne({ _id });
    if (!existing) {
      return Response.json({ success: false, error: "Message not found." }, { status: 404 });
    }

    const sendResult = await sendContactInquiryReply({
      db,
      restaurantId: existing.restaurantId ?? null,
      to: existing.email,
      toName: existing.name,
      subject,
      body: message,
      originalSubject: existing.subject,
      originalMessage: existing.message,
    });

    if (!sendResult.success) {
      return Response.json(
        { success: false, error: sendResult.error ?? "Failed to send reply." },
        { status: sendResult.error?.includes("not configured") ? 422 : 500 }
      );
    }

    const now = new Date();
    const replyEntry = {
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      subject: sendResult.subject,
      body: message,
      to: String(existing.email ?? "").toLowerCase(),
      sentAt: now,
      sentBy: payload.id ?? null,
    };

    await col.updateOne(
      { _id },
      {
        $push: { replies: replyEntry },
        $set: {
          status: "replied",
          updatedAt: now,
          lastReplyAt: now,
        },
      }
    );

    await writeAuditLog({
      action: "settings.updated",
      category: "settings",
      actorId: payload.id,
      targetName: `contact_message_reply:${id}`,
      meta: { to: existing.email, source: existing.source ?? null },
      ip,
    });

    const updated = await col.findOne({ _id });
    const restaurantName = existing.restaurantId
      ? (
          await db
            .collection("restaurants")
            .findOne({ _id: existing.restaurantId }, { projection: { name: 1 } })
        )?.name ?? "Restaurant"
      : null;

    return Response.json({
      success: true,
      message: "Reply sent successfully.",
      contact: {
        ...updated,
        _id: String(updated._id),
        restaurantId: updated.restaurantId ? String(updated.restaurantId) : null,
        restaurantName,
        replies: serializeReplies(updated.replies),
        createdAt: updated.createdAt ?? null,
        updatedAt: updated.updatedAt ?? null,
        lastReplyAt: updated.lastReplyAt ?? null,
      },
    });
  } catch (err) {
    console.error("super-admin.contact-messages.reply.POST failed:", err?.message);
    return Response.json(
      { success: false, error: "Failed to send reply." },
      { status: 500 }
    );
  }
}
