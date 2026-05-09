import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

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

export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = normalizeText(searchParams.get("status"), 20).toLowerCase();
  const priority = normalizeText(searchParams.get("priority"), 20).toLowerCase();
  const q = normalizeText(searchParams.get("q"), 80);
  const limitRaw = Number(searchParams.get("limit") ?? 100);
  const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, limitRaw)) : 100;

  const query = {};
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
    const client = await clientPromise;
    const db = client.db();
    const tickets = await db
      .collection("support_tickets")
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .toArray();

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
    return Response.json({ success: true, tickets: rows });
  } catch (err) {
    console.error("super-admin.support-tickets.GET failed:", err.message);
    return Response.json(
      { success: false, error: "Failed to load support tickets." },
      { status: 500 }
    );
  }
}
