import { formatAdminMoney } from "@/lib/adminCurrency";
import {
  DEFAULT_LOCALE_PREFS,
  formatAdminDate,
  formatTimeFromDate,
  normalizeLocalePrefs,
} from "@/lib/localeFormat";

/** Map API order document → RecentOrdersTable row */
export function mapOrderForDashboard(o) {
  let customer = "Guest";
  if (typeof o.customer === "string" && o.customer.trim()) {
    customer = o.customer.trim();
  } else if (o.customerInfo?.name) {
    customer = o.customerInfo.name;
  } else if (o.customer?.name) {
    customer = o.customer.name;
  }

  return {
    id: o.id,
    orderId: o.orderId,
    customer,
    type: o.orderType ?? o.type,
    orderType: o.orderType ?? o.type,
    tableNumber: o.tableNumber ?? "—",
    amount: o.total ?? 0,
    total: o.total ?? 0,
    status: o.status ?? "new",
    payment: o.payment ?? { method: "cod", status: "pending" },
    createdAt: o.createdAt,
  };
}

export function chartLabelFromDate(
  dateStr,
  mode = "short",
  prefs = DEFAULT_LOCALE_PREFS
) {
  const p = normalizeLocalePrefs(prefs);
  const d = new Date(`${dateStr}T12:00:00`);
  if (mode === "weekday") {
    return d.toLocaleDateString("en-US", {
      timeZone: p.timezone,
      weekday: "short",
    });
  }
  if (mode === "month") {
    return d.toLocaleDateString("en-US", {
      timeZone: p.timezone,
      month: "short",
    });
  }
  return formatAdminDate(dateStr, p, { style: "short" });
}

export function dailyRevenueToChartPoints(
  dailyRevenue = [],
  labelMode = "short",
  prefs = DEFAULT_LOCALE_PREFS
) {
  return dailyRevenue.map((d) => ({
    key: d.date ?? d.label,
    label: chartLabelFromDate(d.date, labelMode, prefs),
    sales: d.revenue ?? 0,
    orders: d.orders ?? 0,
  }));
}

export function groupDailyByMonth(dailyRevenue = [], prefs = DEFAULT_LOCALE_PREFS) {
  const p = normalizeLocalePrefs(prefs);
  const byMonth = new Map();
  for (const d of dailyRevenue) {
    const key = d.date?.slice(0, 7);
    if (!key) continue;
    const prev = byMonth.get(key) ?? { month: key, sales: 0, orders: 0 };
    prev.sales += d.revenue ?? 0;
    prev.orders += d.orders ?? 0;
    byMonth.set(key, prev);
  }
  return [...byMonth.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((m) => {
      const label = new Date(`${m.month}-01T12:00:00`).toLocaleDateString("en-US", {
        timeZone: p.timezone,
        month: "short",
      });
      return { key: m.month, label, month: label, sales: m.sales, orders: m.orders };
    });
}

export function buildSalesChartData({ todayKpis, weekDaily, monthDaily, localePrefs }) {
  const prefs = normalizeLocalePrefs(localePrefs);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayFromWeek = (weekDaily ?? []).filter((d) => d.date === todayStr);

  const todayPoints =
    todayFromWeek.length > 0
      ? dailyRevenueToChartPoints(todayFromWeek, "short", prefs)
      : [
          {
            key: todayStr,
            label: "Today",
            sales: todayKpis?.totalRevenue ?? 0,
            orders: todayKpis?.totalOrders ?? 0,
          },
        ];

  return {
    Today: todayPoints,
    Weekly: dailyRevenueToChartPoints(weekDaily ?? [], "weekday", prefs),
    Monthly: dailyRevenueToChartPoints(monthDaily ?? [], "short", prefs),
    Yearly: groupDailyByMonth(monthDaily ?? [], prefs),
  };
}

export function splitPeriodRevenue(dailyRevenue = []) {
  if (!dailyRevenue.length) return { current: 0, previous: 0 };
  const mid = Math.floor(dailyRevenue.length / 2);
  const previous = dailyRevenue.slice(0, mid).reduce((s, d) => s + (d.revenue ?? 0), 0);
  const current = dailyRevenue.slice(mid).reduce((s, d) => s + (d.revenue ?? 0), 0);
  return { current, previous };
}

export function computePeakHour(orders = [], prefs = DEFAULT_LOCALE_PREFS) {
  const p = normalizeLocalePrefs(prefs);
  const counts = new Map();
  for (const o of orders) {
    if (!o.createdAt) continue;
    const label = formatTimeFromDate(o.createdAt, p);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (counts.size === 0) return "—";
  let best = "—";
  let max = 0;
  for (const [label, n] of counts) {
    if (n > max) {
      max = n;
      best = label;
    }
  }
  return best;
}

export function buildDashboardInsights({
  salesToday,
  ordersToday,
  lowStockCount,
  topItems = [],
  activeTables,
  totalTables,
  currency = "INR",
}) {
  const insights = [];
  if (ordersToday > 0) {
    insights.push({
      type: "positive",
      icon: "trending-up",
      text: `${ordersToday} order${ordersToday === 1 ? "" : "s"} today (since midnight).`,
    });
  }
  if (salesToday > 0) {
    insights.push({
      type: "info",
      icon: "star",
      text: `Revenue today is ${formatAdminMoney(salesToday, currency)}.`,
    });
  }
  if (topItems[0]?.name) {
    insights.push({
      type: "positive",
      icon: "star",
      text: `Top seller: ${topItems[0].name} (${topItems[0].qty ?? topItems[0].orders ?? 0} sold).`,
    });
  }
  if (lowStockCount > 0) {
    insights.push({
      type: "warning",
      icon: "alert",
      text: `${lowStockCount} inventory item${lowStockCount === 1 ? "" : "s"} need reorder.`,
    });
  }
  if (totalTables > 0) {
    insights.push({
      type: "info",
      icon: "users",
      text: `${activeTables} of ${totalTables} tables are occupied right now.`,
    });
  }
  return insights;
}

export function countReservationsToday(reservations = []) {
  const today = new Date().toISOString().slice(0, 10);
  return reservations.filter(
    (r) => r.date === today && r.status !== "cancelled" && r.status !== "completed"
  ).length;
}
