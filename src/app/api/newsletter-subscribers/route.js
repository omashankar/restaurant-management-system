import { withTenant } from "@/lib/tenantDb";
import { buildPaginationMeta, paginationSkip, parseLimitParam, parsePageParam } from "@/lib/pagination";

export const GET = withTenant(["admin", "manager"], async ({ db, restaurantId }, request) => {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim().slice(0, 80);
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), { defaultLimit: 20, maxLimit: 200 });
  const statsOnly = searchParams.get("stats") === "1";

  const baseQuery = { restaurantId };
  const col = db.collection("newsletter_subscribers");

  if (statsOnly) {
    const total = await col.countDocuments(baseQuery);
    return Response.json({ success: true, stats: { total } });
  }

  const query = q
    ? { ...baseQuery, email: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
    : baseQuery;
  const skip = paginationSkip(page, limit);

  const [subscribers, total] = await Promise.all([
    col.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta({ page, limit, total });
  return Response.json({
    success: true,
    subscribers: subscribers.map((s) => ({
      id: String(s._id),
      email: s.email ?? "",
      source: s.source ?? "customer_site",
      createdAt: s.createdAt ?? null,
      updatedAt: s.updatedAt ?? null,
    })),
    pagination: { page: pagination.page, limit, total, pages: pagination.pages },
  });
});
