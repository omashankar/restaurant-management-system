import { withTenant } from "@/lib/tenantDb";

const COMPLETED_STATUSES = ["completed", "ready"];
const ACTIVE_STATUSES = ["new", "preparing", "ready", "completed"];

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter, restaurantId }, request) => {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30"; // days
    const days  = parseInt(range, 10) || 30;

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    const dateFilter = { ...tenantFilter, createdAt: { $gte: since } };
    const revenueMatch = { ...dateFilter, status: { $ne: "cancelled" } };

    /* ── Run all aggregations in parallel ── */
    const [
      revenueAgg,
      ordersAgg,
      topItemsAgg,
      dailyRevenueAgg,
      orderTypeAgg,
      settingsDoc,
    ] = await Promise.all([

      /* Total revenue — all non-cancelled orders in range */
      db.collection("orders").aggregate([
        { $match: revenueMatch },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]).toArray(),

      /* Orders in range grouped by status */
      db.collection("orders").aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).toArray(),

      /* Top selling items */
      db.collection("orders").aggregate([
        { $match: { ...dateFilter, status: { $in: ACTIVE_STATUSES } } },
        { $unwind: "$items" },
        { $group: {
          _id: "$items.name",
          qty:     { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        }},
        { $sort: { qty: -1 } },
        { $limit: 50 },
      ]).toArray(),

      /* Daily revenue (last N days) */
      db.collection("orders").aggregate([
        { $match: { ...dateFilter, status: { $in: COMPLETED_STATUSES } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders:  { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      /* Orders by type */
      db.collection("orders").aggregate([
        { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
        { $group: { _id: "$orderType", count: { $sum: 1 } } },
      ]).toArray(),

      restaurantId
        ? db.collection("restaurant_settings").findOne(
            { restaurantId },
            { projection: { "general.currency": 1 } }
          )
        : Promise.resolve(null),
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const revenueOrderCount = revenueAgg[0]?.count ?? 0;
    const statusMap = Object.fromEntries(ordersAgg.map((s) => [s._id, s.count]));
    const totalOrders = Object.entries(statusMap).reduce(
      (sum, [status, count]) => (status === "cancelled" ? sum : sum + count),
      0
    );
    const avgOrder = revenueOrderCount > 0 ? totalRevenue / revenueOrderCount : 0;
    const typeMap   = Object.fromEntries(orderTypeAgg.map((t) => [t._id, t.count]));
    const currency =
      settingsDoc?.general?.currency?.trim()?.toUpperCase() || "INR";

    return Response.json({
      success: true,
      range: days,
      currency,
      kpis: {
        totalRevenue:  Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrder * 100) / 100,
        completedOrders: (statusMap.completed ?? 0) + (statusMap.ready ?? 0),
        cancelledOrders: statusMap.cancelled ?? 0,
      },
      topItems: topItemsAgg.map((i) => ({
        name:    i._id,
        qty:     i.qty,
        revenue: Math.round(i.revenue * 100) / 100,
      })),
      dailyRevenue: dailyRevenueAgg.map((d) => ({
        date:    d._id,
        revenue: Math.round(d.revenue * 100) / 100,
        orders:  d.orders,
      })),
      ordersByType: [
        { name: "Dine-In",  value: typeMap["dine-in"]  ?? 0, color: "#10b981" },
        { name: "Takeaway", value: typeMap["takeaway"]  ?? 0, color: "#6366f1" },
        { name: "Delivery", value: typeMap["delivery"]  ?? 0, color: "#f59e0b" },
      ],
    });
  }
);
