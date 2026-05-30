import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import { parseSchema, superAdminPlanUpsertSchema } from "@/lib/validationSchemas";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function toPlanSlug(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── GET /api/super-admin/plans ── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  try {
    const client = await clientPromise;
    const db     = client.db();
    const plans  = await db.collection("plans").find({}).sort({ price: 1 }).toArray();

    // Attach subscriber count per plan
    const counts = await db.collection("restaurants").aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]).toArray();
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    return Response.json({
      success: true,
      plans: plans.map((p) => ({
        monthlyPrice: Number.isFinite(Number(p.monthlyPrice))
          ? Number(p.monthlyPrice)
          : (p.billingCycle === "yearly" ? Number((Number(p.price ?? 0) / 12).toFixed(2)) : Number(p.price ?? 0)),
        yearlyPrice: Number.isFinite(Number(p.yearlyPrice))
          ? Number(p.yearlyPrice)
          : (p.billingCycle === "yearly" ? Number(p.price ?? 0) : Number((Number(p.price ?? 0) * 12).toFixed(2))),
        id:           p._id.toString(),
        name:         p.name,
        slug:         p.slug,
        price:        p.price,
        billingCycle: p.billingCycle ?? "monthly",
        description:  p.description ?? "",
        features:     p.features ?? [],
        limits:       p.limits ?? {},
        isActive:     p.isActive ?? true,
        subscribers:  countMap[p.slug] ?? 0,
        createdAt:    p.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET plans error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── POST /api/super-admin/plans — create plan ── */
export async function POST(request) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const {
    name,
    price,
    monthlyPrice,
    yearlyPrice,
    billingCycle = "monthly",
    description,
    features = [],
    limits = {},
  } = body;

  const monthlyNum = Number(monthlyPrice);
  const yearlyNum = Number(yearlyPrice);
  const legacyPriceNum = Number(price);
  const hasDualPrice =
    Number.isFinite(monthlyNum) && monthlyNum >= 0 && Number.isFinite(yearlyNum) && yearlyNum >= 0;
  const hasLegacyPrice = Number.isFinite(legacyPriceNum) && legacyPriceNum >= 0;
  if (!hasDualPrice && !hasLegacyPrice) {
    return Response.json(
      { success: false, error: "Valid monthlyPrice and yearlyPrice are required." },
      { status: 400 }
    );
  }

  const effectiveMonthly = hasDualPrice
    ? monthlyNum
    : billingCycle === "yearly"
      ? Number((legacyPriceNum / 12).toFixed(2))
      : legacyPriceNum;
  const effectiveYearly = hasDualPrice
    ? yearlyNum
    : billingCycle === "yearly"
      ? legacyPriceNum
      : Number((legacyPriceNum * 12).toFixed(2));

  const limitKeys = ["staff", "tables", "menuItems", "orders"];
  const normalizedLimits = {};
  for (const k of limitKeys) {
    const raw = limits[k];
    if (raw == null || raw === "") {
      normalizedLimits[k] = -1;
      continue;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < -1) {
      return Response.json(
        { success: false, error: `Invalid limit for ${k}: use -1 (unlimited) or a whole number ≥ -1.` },
        { status: 400 }
      );
    }
    normalizedLimits[k] = n;
  }

  let validated;
  try {
    validated = parseSchema(superAdminPlanUpsertSchema, {
      name: String(name ?? "").trim(),
      monthlyPrice: effectiveMonthly,
      yearlyPrice: effectiveYearly,
      billingCycle,
      description: description?.trim() ?? "",
      features: Array.isArray(features) ? features : [],
      limits: normalizedLimits,
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  const slug = toPlanSlug(validated.name);

  try {
    const client = await clientPromise;
    const db     = client.db();

    const existing = await db.collection("plans").findOne({ slug });
    if (existing) return Response.json({ success: false, error: "A plan with this name already exists." }, { status: 409 });

    const result = await db.collection("plans").insertOne({
      name:         validated.name,
      slug,
      price:
        validated.billingCycle === "yearly" ? validated.yearlyPrice : validated.monthlyPrice,
      monthlyPrice: validated.monthlyPrice,
      yearlyPrice:  validated.yearlyPrice,
      billingCycle: validated.billingCycle,
      description:  validated.description ?? "",
      features:     validated.features ?? [],
      limits:       validated.limits ?? normalizedLimits,
      isActive:     true,
      createdAt:    new Date(),
    });

    await writeAuditLog({
      action: "billing.plan_created",
      category: "billing",
      actorId: sa.id,
      targetId: result.insertedId.toString(),
      targetName: validated.name,
      meta: { slug },
      ip: getClientIp(request),
    });

    return Response.json({
      success: true,
      plan: {
        id: result.insertedId.toString(),
        name: validated.name,
        slug,
        monthlyPrice: validated.monthlyPrice,
        yearlyPrice: validated.yearlyPrice,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("POST plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
