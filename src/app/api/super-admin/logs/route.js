/**
 * GET  /api/super-admin/logs  — paginated audit log
 * POST /api/super-admin/logs  — write a log entry (internal use)
 *
 * Collection: audit_logs
 * Schema:
 *   action    string   — e.g. "restaurant.created", "user.blocked"
 *   category  string   — "restaurant" | "user" | "payment" | "settings" | "auth" | "system"
 *   actorId   string   — super admin user id
 *   actorName string
 *   targetId  string   — affected resource id (optional)
 *   targetName string  — human-readable name (optional)
 *   meta      object   — extra context
 *   ip        string
 *   createdAt Date
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

const VALID_CATEGORIES = ["restaurant", "user", "payment", "settings", "auth", "system", "billing"];
const PAGE_SIZE = 25;

/* ── GET /api/super-admin/logs ── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page     = Math.max(1, Number(searchParams.get("page") ?? 1));
  const category = searchParams.get("category") ?? "all";
  const search   = searchParams.get("search")?.trim() ?? "";
  const skip     = (page - 1) * PAGE_SIZE;

  try {
    const client = await clientPromise;
    const db     = client.db();

    const filter = {};
    if (category !== "all" && VALID_CATEGORIES.includes(category)) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { action:     { $regex: search, $options: "i" } },
        { actorName:  { $regex: search, $options: "i" } },
        { targetName: { $regex: search, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.collection("audit_logs")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .toArray(),
      db.collection("audit_logs").countDocuments(filter),
    ]);

    // Category counts for filter badges
    const categoryCounts = await db.collection("audit_logs").aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]).toArray();

    return Response.json({
      success: true,
      logs: logs.map((l) => ({
        id:         l._id.toString(),
        action:     l.action,
        category:   l.category,
        actorName:  l.actorName ?? "System",
        targetName: l.targetName ?? null,
        meta:       l.meta ?? {},
        ip:         l.ip ?? null,
        createdAt:  l.createdAt,
      })),
      pagination: {
        page,
        pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        total,
      },
      categoryCounts: Object.fromEntries(
        categoryCounts.map((c) => [c._id, c.count])
      ),
    });
  } catch (err) {
    console.error("GET logs error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── POST /api/super-admin/logs — write a log entry ── */
export async function POST(request) {
  // Allow super_admin OR internal server calls (no token = system log)
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { action, category, targetId, targetName, meta } = body;
  if (!action || !category) {
    return Response.json({ success: false, error: "action and category are required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    const ip = request.headers.get("x-forwarded-for")
      ?? request.headers.get("x-real-ip")
      ?? "unknown";

    await db.collection("audit_logs").insertOne({
      action,
      category,
      actorId:    payload?.id   ?? "system",
      actorName:  payload?.name ?? "System",
      targetId:   targetId   ?? null,
      targetName: targetName ?? null,
      meta:       meta       ?? {},
      ip,
      createdAt:  new Date(),
    });

    return Response.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("POST log error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
