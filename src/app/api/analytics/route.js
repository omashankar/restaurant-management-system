import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request) => {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") ?? "30"; // days
    const days  = parseInt(range, 10) || 30;

    const since = new Date();
    since.setDate(since.getDate() - days);
    const dateFilter = { ...tenantFilter, createdAt: { $gte: since } };

    /* ── Run all aggregations in parallel ── */
    const [
      revenueAgg,
      ordersAgg,
      topItemsAgg,
      dailyRevenueAgg,
      orderTypeAgg,
    ] = await Promise.all([

      /* Total revenue */
      db.collection("orders").aggregate([
        { $match: { ...dateFilter, status: { $in: ["completed", "ready"] } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]).toArray(),

      /* Orders in range grouped by status (used for totals + completed/cancelled KPIs) */
      db.collection("orders").aggregate([
        { $match: dateFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]).toArray(),

      /* Top selling items */
      db.collection("orders").aggregate([
        { $match: { ...dateFilter, status: { $in: ["completed", "ready", "preparing"] } } },
        { $unwind: "$items" },
        { $group: {
          _id: "$items.name",
          qty:     { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        }},
        { $sort: { qty: -1 } },
        { $limit: 10 },
      ]).toArray(),

      /* Daily revenue (last N days) */
      db.collection("orders").aggregate([
        { $match: { ...dateFilter, status: { $in: ["completed", "ready"] } } },
        { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders:  { $sum: 1 },
        }},
        { $sort: { _id: 1 } },
      ]).toArray(),

      /* Orders by type */
      db.collection("orders").aggregate([
        { $match: dateFilter },
        { $group: { _id: "$orderType", count: { $sum: 1 } } },
      ]).toArray(),
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;
    const totalOrders  = ordersAgg.reduce((s, o) => s + o.count, 0);
    const avgOrder     = totalOrders > 0 ? totalRevenue / (revenueAgg[0]?.count ?? 1) : 0;

    const statusMap = Object.fromEntries(ordersAgg.map((s) => [s._id, s.count]));
    const typeMap   = Object.fromEntries(orderTypeAgg.map((t) => [t._id, t.count]));

    return Response.json({
      success: true,
      range: days,
      kpis: {
        totalRevenue:  Math.round(totalRevenue * 100) / 100,
        totalOrders,
        avgOrderValue: Math.round(avgOrder * 100) / 100,
        completedOrders: statusMap.completed ?? 0,
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
