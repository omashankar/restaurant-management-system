import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ── GET /api/super-admin/billing
   Returns subscription overview, revenue by month, and per-restaurant billing.
── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    /* Revenue by month (last 6 months) */
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      revenueByMonth,
      planBreakdown,
      restaurants,
      totalRevenue,
      pendingCount,
    ] = await Promise.all([
      db.collection("payments").aggregate([
        { $match: { status: "paid", createdAt: { $gte: sixMonthsAgo } } },
        { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count:   { $sum: 1 },
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]).toArray(),

      db.collection("restaurants").aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      db.collection("restaurants")
        .find({}, { projection: { name: 1, plan: 1, status: 1, ownerEmail: 1, createdAt: 1 } })
        .sort({ createdAt: -1 })
        .toArray(),

      db.collection("payments").aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).toArray().then((r) => r[0]?.total ?? 0),

      db.collection("payments").countDocuments({ status: "pending" }),
    ]);

    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    return Response.json({
      success: true,
      overview: {
        totalRevenue,
        pendingCount,
        totalRestaurants: restaurants.length,
        activeRestaurants: restaurants.filter((r) => r.status === "active").length,
      },
      revenueByMonth: revenueByMonth.map((r) => ({
        label:   `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
        revenue: r.revenue,
        count:   r.count,
      })),
      planBreakdown: planBreakdown.map((p) => ({
        plan:  p._id ?? "unknown",
        count: p.count,
      })),
      subscriptions: restaurants.map((r) => ({
        id:         r._id.toString(),
        name:       r.name,
        plan:       r.plan ?? "free",
        status:     r.status ?? "active",
        ownerEmail: r.ownerEmail ?? "—",
        createdAt:  r.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET billing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
