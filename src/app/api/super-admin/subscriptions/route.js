import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { assignPlan } from "@/lib/subscription";
import { parseSchema, superAdminAssignPlanSchema } from "@/lib/validationSchemas";
import { ObjectId } from "mongodb";
import { buildPaginationMeta, paginationSkip, parseLimitParam, parsePageParam } from "@/lib/pagination";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function GET(request) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status") ?? "all";

    const client = await clientPromise;
    const db     = client.db();

    const filter = {};
    if (statusFilter !== "all") filter.status = statusFilter;

    const page = parsePageParam(searchParams.get("page"));
    const limit = parseLimitParam(searchParams.get("limit"), { defaultLimit: 15, maxLimit: 100 });
    const skip = paginationSkip(page, limit);

    const col = db.collection("subscriptions");
    const [subs, total] = await Promise.all([
      col.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    const rIds = [...new Set(subs.map((s) => s.restaurantId?.toString()).filter(Boolean))];
    let restaurantMap = {};
    if (rIds.length) {
      const restaurants = await db.collection("restaurants")
        .find({ _id: { $in: rIds.map((id) => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean) } },
               { projection: { name: 1, ownerEmail: 1, status: 1 } })
        .toArray();
      restaurantMap = Object.fromEntries(restaurants.map((r) => [r._id.toString(), r]));
    }

    const now = new Date();
    const pagination = buildPaginationMeta({ page, limit, total });
    return Response.json({
      success: true,
      subscriptions: subs.map((s) => {
        const r        = restaurantMap[s.restaurantId?.toString()] ?? null;
        const daysLeft = s.endDate ? Math.max(0, Math.ceil((new Date(s.endDate) - now) / 86_400_000)) : null;
        return {
          id:               s._id.toString(),
          restaurantId:     s.restaurantId?.toString() ?? null,
          restaurantName:   r?.name       ?? "—",
          restaurantEmail:  r?.ownerEmail ?? "—",
          restaurantStatus: r?.status     ?? "active",
          planSlug:         s.planSlug    ?? "free",
          planName:         s.planName    ?? "Free",
          price:            s.price       ?? 0,
          billingCycle:     s.billingCycle ?? "monthly",
          status:           s.status      ?? "active",
          startDate:        s.startDate,
          endDate:          s.endDate,
          trialEnd:         s.trialEnd    ?? null,
          daysLeft,
          limits:           s.limits      ?? {},
          createdAt:        s.createdAt,
          updatedAt:        s.updatedAt,
        };
      }),
      pagination: { page: pagination.page, limit, total, pages: pagination.pages },
    });
  } catch (err) {
    console.error("GET subscriptions error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

export async function POST(request) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  let validated;
  try {
    validated = parseSchema(superAdminAssignPlanSchema, {
      restaurantId: body.restaurantId,
      planSlug: body.planSlug,
      startDate: body.startDate || undefined,
      endDate: body.endDate || undefined,
      trialDays: body.trialDays ?? 0,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  if (!ObjectId.isValid(validated.restaurantId)) {
    return Response.json({ success: false, error: "Invalid restaurant." }, { status: 400 });
  }

  try {
    const sub = await assignPlan(validated.restaurantId, validated.planSlug, {
      startDate: validated.startDate,
      endDate: validated.endDate,
      trialDays: validated.trialDays,
    });
    return Response.json({ success: true, subscription: sub }, { status: 201 });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return Response.json({ success: false, error: err.message }, { status });
  }
}
