import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
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
  if (!superAdminOnly(request)) {
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

  if (!name?.trim())    return Response.json({ success: false, error: "Plan name is required." }, { status: 400 });
  const monthlyNum = Number(monthlyPrice);
  const yearlyNum = Number(yearlyPrice);
  const legacyPriceNum = Number(price);
  const hasDualPrice = Number.isFinite(monthlyNum) && monthlyNum >= 0 && Number.isFinite(yearlyNum) && yearlyNum >= 0;
  const hasLegacyPrice = Number.isFinite(legacyPriceNum) && legacyPriceNum >= 0;
  if (!hasDualPrice && !hasLegacyPrice) {
    return Response.json({ success: false, error: "Valid monthlyPrice and yearlyPrice are required." }, { status: 400 });
  }
  if (!["monthly", "yearly"].includes(billingCycle)) {
    return Response.json({ success: false, error: "Invalid billingCycle." }, { status: 400 });
  }

  const slug = name.trim().toLowerCase().replace(/\s+/g, "-");

  try {
    const client = await clientPromise;
    const db     = client.db();

    const existing = await db.collection("plans").findOne({ slug });
    if (existing) return Response.json({ success: false, error: "A plan with this name already exists." }, { status: 409 });

    const effectiveMonthly = hasDualPrice
      ? monthlyNum
      : (billingCycle === "yearly" ? Number((legacyPriceNum / 12).toFixed(2)) : legacyPriceNum);
    const effectiveYearly = hasDualPrice
      ? yearlyNum
      : (billingCycle === "yearly" ? legacyPriceNum : Number((legacyPriceNum * 12).toFixed(2)));
    const result = await db.collection("plans").insertOne({
      name:         name.trim(),
      slug,
      price:        billingCycle === "yearly" ? effectiveYearly : effectiveMonthly,
      monthlyPrice: effectiveMonthly,
      yearlyPrice:  effectiveYearly,
      billingCycle,
      description:  description?.trim() ?? "",
      features,
      limits,
      isActive:     true,
      createdAt:    new Date(),
    });

    return Response.json({
      success: true,
      plan: {
        id: result.insertedId.toString(),
        name: name.trim(),
        slug,
        monthlyPrice: effectiveMonthly,
        yearlyPrice: effectiveYearly,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("POST plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
