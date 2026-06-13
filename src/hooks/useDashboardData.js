"use client";

import {
  buildDashboardInsights,
  buildSalesChartData,
  chartLabelFromDate,
  computePeakHour,
  mapOrderForDashboard,
  splitPeriodRevenue,
} from "@/lib/dashboardAnalytics";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { useCallback, useEffect, useState } from "react";

const EMPTY = {
  currency: "INR",
  salesToday: 0,
  ordersToday: 0,
  customerCount: 0,
  reservationsToday: 0,
  reservationsCalendarDate: "",
  lowStockCount: 0,
  lowStockItems: [],
  activeTables: 0,
  totalTables: 0,
  tableList: [],
  orders: [],
  topItems: [],
  salesChartData: { Today: [], Weekly: [], Monthly: [], Yearly: [] },
  ordersByType: [],
  salesComparison: { current: 0, previous: 0, monthly: [] },
  smartMetrics: {
    peakHour: "—",
    bestCategory: "—",
    lowStockCount: 0,
    lowStockItems: [],
    activeTables: 0,
    totalTables: 0,
    tableList: [],
  },
  insights: [],
};

export function useDashboardData() {
  const { prefs } = useAdminLocale();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch("/api/dashboard/summary", {
        credentials: "include",
        cache: "no-store",
      });
      const summary = await res.json();

      if (!res.ok || !summary?.success) {
        if (!silent) {
          setError(summary?.error ?? "Could not load dashboard data.");
          setData(EMPTY);
        }
        return;
      }

      const currency = summary.currency ?? "INR";
      const salesToday = summary.today?.revenue ?? 0;
      const ordersToday = summary.today?.orders ?? 0;

      const weekDaily = summary.dailyRevenueWeek ?? [];
      const monthDaily = summary.dailyRevenueMonth ?? [];
      const fortnightDaily = summary.dailyRevenueFortnight ?? [];

      const topItemsToday = summary.topItemsToday ?? [];
      const topItemsWeek = summary.topItemsWeek ?? [];
      const topItems = topItemsToday.length > 0 ? topItemsToday : topItemsWeek;

      const rawOrders = (summary.recentOrders ?? []).map((o) => ({
        ...o,
        id: o.id,
      }));

      const { current, previous } = splitPeriodRevenue(fortnightDaily);

      const tableList = summary.tables ?? [];

      setData({
        currency,
        salesToday,
        ordersToday,
        customerCount: summary.customerCount ?? 0,
        reservationsToday: summary.reservationsToday ?? 0,
        reservationsCalendarDate: summary.reservationsCalendarDate ?? "",
        lowStockCount: summary.lowStockCount ?? 0,
        lowStockItems: summary.lowStockItems ?? [],
        activeTables: summary.activeTables ?? 0,
        totalTables: summary.totalTables ?? 0,
        tableList,
        orders: rawOrders.map(mapOrderForDashboard),
        topItems: topItems.map((i) => ({
          name: i.name,
          orders: i.qty,
          qty: i.qty,
          revenue: i.revenue,
        })),
        salesChartData: buildSalesChartData({
          todayKpis: { totalRevenue: salesToday, totalOrders: ordersToday },
          weekDaily,
          monthDaily,
          localePrefs: prefs,
        }),
        ordersByType: summary.ordersByType ?? [],
        salesComparison: {
          current,
          previous,
          monthly: monthDaily.slice(-6).map((d) => ({
            month: chartLabelFromDate(d.date, "short", prefs),
            sales: d.revenue ?? 0,
          })),
        },
        smartMetrics: {
          peakHour: computePeakHour(rawOrders, prefs),
          bestCategory: topItems[0]?.name ?? "—",
          lowStockCount: summary.lowStockCount ?? 0,
          lowStockItems: summary.lowStockItems ?? [],
          activeTables: summary.activeTables ?? 0,
          totalTables: summary.totalTables ?? 0,
          tableList,
        },
        insights: buildDashboardInsights({
          salesToday,
          ordersToday,
          lowStockCount: summary.lowStockCount ?? 0,
          topItems,
          activeTables: summary.activeTables ?? 0,
          totalTables: summary.totalTables ?? 0,
          currency,
        }),
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error("useDashboardData:", err);
      if (!silent) {
        setError("Could not load dashboard data.");
        setData(EMPTY);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [prefs]);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(load, { intervalMs: 15_000 });

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return { ...data, loading, refreshing, error, lastUpdated, refresh };
}
