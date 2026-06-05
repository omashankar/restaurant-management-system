import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { buildPaginationMeta, paginationSkip, parseLimitParam, parsePageParam } from "@/lib/pagination";

const ALLOWED_PRIORITIES = ["low", "medium", "high", "urgent"];
const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

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

export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = normalizeText(searchParams.get("status"), 20).toLowerCase();
  const priority = normalizeText(searchParams.get("priority"), 20).toLowerCase();
  const q = normalizeText(searchParams.get("q"), 80);
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), { defaultLimit: 15, maxLimit: 100 });
  const statsOnly = searchParams.get("stats") === "1";

  const query = {};
  if (ALLOWED_STATUSES.includes(status)) query.status = status;
  if (ALLOWED_PRIORITIES.includes(priority)) query.priority = priority;
  if (q) {
    const safe = escapeRegex(q);
    query.$or = [
      { ticketCode: { $regex: safe, $options: "i" } },
      { subject: { $regex: safe, $options: "i" } },
      { message: { $regex: safe, $options: "i" } },
    ];
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("support_tickets");

    if (statsOnly) {
      const statsTickets = await col
        .find({})
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(300)
        .toArray();
      return Response.json({ success: true, tickets: statsTickets });
    }

    const skip = paginationSkip(page, limit);
    const [tickets, total] = await Promise.all([
      col.find(query).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    const restaurantIds = [...new Set(tickets.map((t) => String(t.restaurantId)).filter(Boolean))];
    const restaurants = restaurantIds.length
      ? await db
          .collection("restaurants")
          .find({ _id: { $in: tickets.map((t) => t.restaurantId).filter(Boolean) } }, { projection: { name: 1 } })
          .toArray()
      : [];
    const restaurantMap = new Map(restaurants.map((r) => [String(r._id), r.name || "Restaurant"]));

    const rows = tickets.map((t) => ({
      ...t,
      restaurantName: restaurantMap.get(String(t.restaurantId)) || "Unknown Restaurant",
    }));
    const pagination = buildPaginationMeta({ page, limit, total });
    return Response.json({
      success: true,
      tickets: rows,
      pagination: { page: pagination.page, limit, total, pages: pagination.pages },
    });
  } catch (err) {
    console.error("super-admin.support-tickets.GET failed:", err.message);
    return Response.json(
      { success: false, error: "Failed to load support tickets." },
      { status: 500 }
    );
  }
}
