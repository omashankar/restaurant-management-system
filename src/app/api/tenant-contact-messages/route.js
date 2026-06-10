import { withTenant } from "@/lib/tenantDb";
import { buildPaginationMeta, paginationSkip, parseLimitParam, parsePageParam } from "@/lib/pagination";

const ALLOWED_STATUSES = ["new", "read", "replied", "archived"];

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

function serializeMessage(doc) {
  return {
    ...doc,
    _id: String(doc._id),
    restaurantId: doc.restaurantId ? String(doc.restaurantId) : null,
    status: normalizeStatus(doc.status),
    createdAt: doc.createdAt ?? null,
    updatedAt: doc.updatedAt ?? null,
  };
}

export const GET = withTenant(["admin", "manager"], async ({ db, restaurantId }, request) => {
  const { searchParams } = new URL(request.url);
  const status = normalizeText(searchParams.get("status"), 20).toLowerCase();
  const q = normalizeText(searchParams.get("q"), 80);
  const page = parsePageParam(searchParams.get("page"));
  const limit = parseLimitParam(searchParams.get("limit"), { defaultLimit: 15, maxLimit: 100 });
  const statsOnly = searchParams.get("stats") === "1";

  const baseQuery = { restaurantId, source: "customer_site" };
  const col = db.collection("contact_messages");

  if (statsOnly) {
    const [total, newCount] = await Promise.all([
      col.countDocuments(baseQuery),
      col.countDocuments({
        ...baseQuery,
        $or: [{ status: "new" }, { status: { $exists: false } }, { status: "" }],
      }),
    ]);
    return Response.json({ success: true, stats: { total, new: newCount } });
  }

  const and = [baseQuery];
  if (ALLOWED_STATUSES.includes(status)) {
    if (status === "new") {
      and.push({ $or: [{ status: "new" }, { status: { $exists: false } }, { status: "" }] });
    } else {
      and.push({ status });
    }
  }
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
  const query = and.length > 1 ? { $and: and } : baseQuery;
  const skip = paginationSkip(page, limit);

  const [messages, total] = await Promise.all([
    col.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(query),
  ]);

  const pagination = buildPaginationMeta({ page, limit, total });
  return Response.json({
    success: true,
    messages: messages.map(serializeMessage),
    pagination: { page: pagination.page, limit, total, pages: pagination.pages },
  });
});
