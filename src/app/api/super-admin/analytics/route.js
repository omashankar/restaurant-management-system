/**
 * GET /api/super-admin/analytics
 * Aggregates platform-wide analytics for the super admin dashboard.
 *
 * Returns:
 *  - overview stats (restaurants, revenue, users, subscriptions)
 *  - revenue by month (last 12 months)
 *  - restaurant growth by month (last 12 months)
 *  - plan distribution
 *  - payment status breakdown
 *  - top restaurants by revenue
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

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** Fill missing months with zero so charts always show 12 bars */
function fillMonths(data, months) {
  return months.map((m) => {
    const found = data.find((d) => d.label === m);
    return found ?? { label: m, value: 0 };
  });
}

/** Build last N month labels like ["May 2025", "Jun 2025", ...] */
function lastNMonthLabels(n) {
  const labels = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`);
  }
  return labels;
}

export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const [
      totalRestaurants,
      activeRestaurants,
      totalAdmins,
      totalUsers,
      revenueAgg,
      revenueByMonthRaw,
      restaurantGrowthRaw,
      planBreakdownRaw,
      paymentStatusRaw,
      topRestaurantsRaw,
      activeSubsCount,
    ] = await Promise.all([

      db.collection("restaurants").countDocuments(),

      db.collection("restaurants").countDocuments({ status: "active" }),

      db.collection("users").countDocuments({ role: "admin" }),

      db.collection("users").countDocuments(),

      // Total revenue
      db.collection("payments").aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]).toArray(),

      // Revenue by month (last 12)
      db.collection("payments").aggregate([
        { $match: { status: "paid", createdAt: { $gte: twelveMonthsAgo } } },
        { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count:   { $sum: 1 },
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]).toArray(),

      // Restaurant registrations by month (last 12)
      db.collection("restaurants").aggregate([
        { $match: { createdAt: { $gte: twelveMonthsAgo } } },
        { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        }},
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]).toArray(),

      // Plan distribution
      db.collection("restaurants").aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray(),

      // Payment status breakdown
      db.collection("payments").aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).toArray(),

      // Top 5 restaurants by revenue
      db.collection("payments").aggregate([
        { $match: { status: "paid" } },
        { $group: {
          _id:            "$restaurantId",
          restaurantName: { $first: "$restaurantName" },
          revenue:        { $sum: "$amount" },
          txCount:        { $sum: 1 },
        }},
        { $sort: { revenue: -1 } },
        { $limit: 5 },
      ]).toArray(),

      // Active subscriptions
      db.collection("subscriptions").countDocuments({ status: "active" }),
    ]);

    const monthLabels = lastNMonthLabels(12);

    const revenueByMonth = fillMonths(
      revenueByMonthRaw.map((r) => ({
        label: `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
        value: r.revenue,
        count: r.count,
      })),
      monthLabels
    );

    const restaurantGrowth = fillMonths(
      restaurantGrowthRaw.map((r) => ({
        label: `${MONTH_NAMES[r._id.month - 1]} ${r._id.year}`,
        value: r.count,
      })),
      monthLabels
    );

    return Response.json({
      success: true,
      overview: {
        totalRestaurants,
        activeRestaurants,
        inactiveRestaurants: totalRestaurants - activeRestaurants,
        totalAdmins,
        totalUsers,
        totalRevenue:   revenueAgg[0]?.total ?? 0,
        totalPayments:  revenueAgg[0]?.count ?? 0,
        activeSubsCount,
      },
      revenueByMonth,
      restaurantGrowth,
      planBreakdown: planBreakdownRaw.map((p) => ({
        plan:  p._id ?? "free",
        count: p.count,
      })),
      paymentStatus: paymentStatusRaw.map((p) => ({
        status: p._id ?? "unknown",
        count:  p.count,
      })),
      topRestaurants: topRestaurantsRaw.map((r) => ({
        id:             r._id?.toString() ?? "",
        restaurantName: r.restaurantName ?? "Unknown",
        revenue:        r.revenue,
        txCount:        r.txCount,
      })),
    });
  } catch (err) {
    console.error("GET analytics error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
