import { canSendOutboundEmail } from "@/lib/emailService";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { buildPaginationMeta, paginationSkip, parseLimitParam, parsePageParam } from "@/lib/pagination";

const ALLOWED_STATUSES = ["new", "read", "replied", "archived"];
const ALLOWED_SOURCES = ["landing_page", "customer_site"];

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function normalizeText(value, max = 100) {
  return String(value ?? "").trim().slice(0, max);
}

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeStatus(status) {
  const value = String(status ?? "").trim().toLowerCase();
  return ALLOWED_STATUSES.includes(value) ? value : "new";
}

function serializeMessage(doc, restaurantName = null) {
  return {
    ...doc,
    _id: String(doc._id),
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
    restaurantName,
    status: normalizeStatus(doc.status),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

function buildQuery({ status, source, q }) {
  const and = [];

  if (ALLOWED_STATUSES.includes(status)) {
    if (status === "new") {
      and.push({ $or: [{ status: "new" }, { status: { $exists: false } }, { status: "" }] });
    } else {
      and.push({ status });
    }
  }

  if (ALLOWED_SOURCES.includes(source)) and.push({ source });

  if (q) {
    const safe = escapeRegex(q);
    and.push({
      $or: [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
        { subject: { $regex: safe, $options: "i" } },
        { message: { $regex: safe, $options: "i" } },
      ],
    });
  }

  return and.length ? { $and: and } : {};
}

export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = normalizeText(searchParams.get("status"), 20).toLowerCase();
  const source = normalizeText(searchParams.get("source"), 30).toLowerCase();
  const q = normalizeText(searchParams.get("q"), 80);
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), { defaultLimit: 15, maxLimit: 100 });
  const statsOnly = searchParams.get("stats") === "1";

  const query = buildQuery({ status, source, q });

  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("contact_messages");

    if (statsOnly) {
      const [total, newCount, readCount, repliedCount, archivedCount, landingCount, customerCount] =
        await Promise.all([
          col.countDocuments({}),
          col.countDocuments({ $or: [{ status: "new" }, { status: { $exists: false } }, { status: "" }] }),
          col.countDocuments({ status: "read" }),
          col.countDocuments({ status: "replied" }),
          col.countDocuments({ status: "archived" }),
          col.countDocuments({ source: "landing_page" }),
          col.countDocuments({ source: "customer_site" }),
        ]);

      const emailConfigured = await canSendOutboundEmail(db, null);

      return Response.json({
        success: true,
        stats: {
          total,
          new: newCount,
          read: readCount,
          replied: repliedCount,
          archived: archivedCount,
          landing_page: landingCount,
          customer_site: customerCount,
          emailConfigured,
        },
      });
    }

    const skip = paginationSkip(page, limit);
    const [messages, total] = await Promise.all([
      col.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    const restaurantIds = [...new Set(messages.map((m) => m.restaurantId).filter(Boolean))];
    const restaurants = restaurantIds.length
      ? await db
          .collection("restaurants")
          .find({ _id: { $in: restaurantIds } }, { projection: { name: 1 } })
          .toArray()
      : [];
    const restaurantMap = new Map(restaurants.map((r) => [String(r._id), r.name || "Restaurant"]));

    const rows = messages.map((m) =>
      serializeMessage(m, m.restaurantId ? restaurantMap.get(String(m.restaurantId)) ?? null : null)
    );

    const pagination = buildPaginationMeta({ page, limit, total });
    return Response.json({
      success: true,
      messages: rows,
      pagination: { page: pagination.page, limit, total, pages: pagination.pages },
    });
  } catch (err) {
    console.error("super-admin.contact-messages.GET failed:", err?.message);
    return Response.json(
      { success: false, error: "Failed to load contact messages." },
      { status: 500 }
    );
  }
}
