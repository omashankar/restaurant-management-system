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
      subscriptions,
      totalRestaurants,
      activeRestaurants,
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

      db.collection("subscriptions").aggregate([
        { $sort: { updatedAt: -1, createdAt: -1 } },
        { $group: { _id: "$restaurantId", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
        { $group: { _id: "$planSlug", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      db.collection("subscriptions").aggregate([
        { $sort: { updatedAt: -1, createdAt: -1 } },
        { $group: { _id: "$restaurantId", latest: { $first: "$$ROOT" } } },
        { $replaceRoot: { newRoot: "$latest" } },
        {
          $lookup: {
            from: "restaurants",
            localField: "restaurantId",
            foreignField: "_id",
            as: "restaurant",
          },
        },
        {
          $unwind: {
            path: "$restaurant",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            restaurantId: "$restaurantId",
            plan: { $ifNull: ["$planSlug", "free"] },
            subscriptionStatus: { $ifNull: ["$status", "active"] },
            ownerEmail: { $ifNull: ["$restaurant.ownerEmail", "—"] },
            name: { $ifNull: ["$restaurant.name", "Unknown"] },
            restaurantStatus: { $ifNull: ["$restaurant.status", "inactive"] },
            createdAt: { $ifNull: ["$restaurant.createdAt", "$createdAt"] },
          },
        },
        { $sort: { createdAt: -1 } },
      ]).toArray(),

      db.collection("restaurants").countDocuments(),
      db.collection("restaurants").countDocuments({ status: "active" }),

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
        totalRestaurants,
        activeRestaurants,
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
      subscriptions: subscriptions.map((r) => ({
        id:         r.restaurantId?.toString() ?? "",
        name:       r.name,
        plan:       r.plan ?? "free",
        status:     r.subscriptionStatus ?? "active",
        ownerEmail: r.ownerEmail ?? "—",
        createdAt:  r.createdAt,
      })),
    });
  } catch (err) {
    console.error("GET billing error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
