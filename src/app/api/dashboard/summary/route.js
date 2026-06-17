import { getCalendarDateInTimeZone } from "@/lib/restaurantDate";
import { withTenant } from "@/lib/tenantDb";

const COMPLETED_STATUSES = ["completed", "ready"];
const ACTIVE_STATUSES = ["new", "preparing", "ready", "completed"];
/** Revenue charts align with “Sales today” — all non-cancelled orders */
const REVENUE_STATUS_MATCH = { status: { $ne: "cancelled" } };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function mapRecentOrder(o) {
  let customer = "Guest";
  if (typeof o.customer === "string" && o.customer.trim()) {
    customer = o.customer.trim();
  } else if (o.customerInfo?.name) {
    customer = o.customerInfo.name;
  }

  return {
    id: o._id.toString(),
    orderId: o.orderId,
    customer,
    orderType: o.orderType,
    tableNumber: o.tableNumber ?? "—",
    total: o.total ?? 0,
    status: o.status ?? "new",
    payment: o.payment ?? { method: "cod", status: "pending" },
    createdAt: o.createdAt,
  };
}

export const GET = withTenant(["admin", "manager"], async ({ db, tenantFilter, restaurantId }) => {
  const settingsDoc = restaurantId
    ? await db.collection("restaurant_settings").findOne(
        { restaurantId },
        { projection: { "general.currency": 1, "general.restaurantName": 1, "general.timezone": 1 } },
      )
    : null;

  const timeZone = settingsDoc?.general?.timezone || "Asia/Kolkata";
  const todayStr = getCalendarDateInTimeZone(timeZone);
  const todayStart = startOfToday();
  const weekStart = daysAgo(7);
  const monthStart = daysAgo(30);
  const fortnightStart = daysAgo(14);

  const [
    todayOrdersAgg,
    weekDailyAgg,
    monthDailyAgg,
    fortnightDailyAgg,
    topItemsTodayAgg,
    topItemsWeekAgg,
    orderTypeWeekAgg,
    recentOrders,
    inventoryItems,
    tables,
    customerCount,
    reservationsToday,
  ] = await Promise.all([
    db.collection("orders").aggregate([
      {
        $match: {
          ...tenantFilter,
          createdAt: { $gte: todayStart },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          orders: { $sum: 1 },
          revenue: { $sum: "$total" },
          completedRevenue: {
            $sum: {
              $cond: [{ $in: ["$status", COMPLETED_STATUSES] }, "$total", 0],
            },
          },
        },
      },
    ]).toArray(),

    db.collection("orders").aggregate([
      {
        $match: {
          ...tenantFilter,
          createdAt: { $gte: weekStart },
          ...REVENUE_STATUS_MATCH,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),

    db.collection("orders").aggregate([
      {
        $match: {
          ...tenantFilter,
          createdAt: { $gte: monthStart },
          ...REVENUE_STATUS_MATCH,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),

    db.collection("orders").aggregate([
      {
        $match: {
          ...tenantFilter,
          createdAt: { $gte: fortnightStart },
          ...REVENUE_STATUS_MATCH,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray(),

    db.collection("orders").aggregate([
      {
        $match: {
          ...tenantFilter,
          createdAt: { $gte: todayStart },
          status: { $in: ACTIVE_STATUSES },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]).toArray(),

    db.collection("orders").aggregate([
      {
        $match: {
          ...tenantFilter,
          createdAt: { $gte: weekStart },
          status: { $in: ACTIVE_STATUSES },
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          qty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        },
      },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ]).toArray(),

    db.collection("orders").aggregate([
      { $match: { ...tenantFilter, createdAt: { $gte: weekStart } } },
      { $group: { _id: "$orderType", count: { $sum: 1 } } },
    ]).toArray(),

    db.collection("orders")
      .find(tenantFilter)
      .sort({ createdAt: -1 })
      .limit(12)
      .toArray(),

    db.collection("inventory").find(tenantFilter).sort({ name: 1 }).limit(500).toArray(),

    db.collection("tables").find(tenantFilter).sort({ tableNumber: 1 }).limit(500).toArray(),

    db.collection("customers").countDocuments(tenantFilter),

    db.collection("reservations").countDocuments({
      ...tenantFilter,
      date: todayStr,
      status: { $in: ["pending", "confirmed"] },
    }),
  ]);

  const todayKpi = todayOrdersAgg[0] ?? {};
  const typeMap = Object.fromEntries(orderTypeWeekAgg.map((t) => [t._id, t.count]));

  const lowStockItems = inventoryItems.filter(
    (i) =>
      i.status === "low" ||
      i.status === "out" ||
      Number(i.quantity ?? 0) <= Number(i.reorderLevel ?? 0)
  );

  const mapDaily = (rows) =>
    rows.map((d) => ({
      date: d._id,
      revenue: Math.round((d.revenue ?? 0) * 100) / 100,
      orders: d.orders ?? 0,
    }));

  const mapTopItems = (rows) =>
    rows.map((i) => ({
      name: i._id,
      qty: i.qty,
      revenue: Math.round((i.revenue ?? 0) * 100) / 100,
    }));

  return Response.json({
    success: true,
    currency: String(settingsDoc?.general?.currency || "INR").toUpperCase(),
    today: {
      orders: todayKpi.orders ?? 0,
      revenue: Math.round((todayKpi.revenue ?? 0) * 100) / 100,
      completedRevenue: Math.round((todayKpi.completedRevenue ?? 0) * 100) / 100,
    },
    customerCount,
    reservationsToday,
    reservationsCalendarDate: todayStr,
    timezone: timeZone,
    lowStockCount: lowStockItems.length,
    lowStockItems: lowStockItems.slice(0, 5).map((i) => ({
      name: i.name,
      quantity: i.quantity,
      unit: i.unit,
    })),
    tables: tables.map((t) => ({
      id: t._id.toString(),
      tableNumber: t.tableNumber,
      status: t.status,
      capacity: t.capacity,
    })),
    activeTables: tables.filter((t) => t.status === "occupied").length,
    totalTables: tables.length,
    recentOrders: recentOrders.map(mapRecentOrder),
    topItemsToday: mapTopItems(topItemsTodayAgg),
    topItemsWeek: mapTopItems(topItemsWeekAgg),
    dailyRevenueWeek: mapDaily(weekDailyAgg),
    dailyRevenueMonth: mapDaily(monthDailyAgg),
    dailyRevenueFortnight: mapDaily(fortnightDailyAgg),
    ordersByType: [
      { name: "Dine-In", value: typeMap["dine-in"] ?? 0, color: "#10b981" },
      { name: "Takeaway", value: typeMap["takeaway"] ?? 0, color: "#6366f1" },
      { name: "Delivery", value: typeMap["delivery"] ?? 0, color: "#f59e0b" },
    ],
  });
});
