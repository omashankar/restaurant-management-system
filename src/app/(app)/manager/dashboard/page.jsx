"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ManagerDashboard from "@/components/views/ManagerDashboard";
import { useEffect, useState } from "react";

function ManagerDashboardData() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [analyticsRes, ordersRes, inventoryRes] = await Promise.all([
          fetch("/api/analytics?range=1"),
          fetch("/api/orders"),
          fetch("/api/inventory"),
        ]);

        const [analyticsData, ordersData, inventoryData] = await Promise.all([
          analyticsRes.json(),
          ordersRes.json(),
          inventoryRes.json(),
        ]);

        const salesToday   = analyticsData.success ? (analyticsData.kpis?.totalRevenue ?? 0) : 0;
        const ordersToday  = analyticsData.success ? (analyticsData.kpis?.totalOrders  ?? 0) : 0;
        const lowStockCount = inventoryData.success
          ? (inventoryData.items ?? []).filter((i) => i.status === "low" || i.status === "out").length
          : 0;

        const orders   = ordersData.success   ? (ordersData.orders   ?? []) : [];
        const topItems = analyticsData.success ? (analyticsData.topItems ?? []) : [];

        setStats({ salesToday, ordersToday, lowStockCount, orders, topItems });
      } catch {
        setStats({ salesToday: 0, ordersToday: 0, lowStockCount: 0, orders: [], topItems: [] });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
      </div>
    );
  }

  return (
    <ManagerDashboard
      salesToday={stats.salesToday}
      ordersToday={stats.ordersToday}
      lowStockCount={stats.lowStockCount}
      orders={stats.orders}
      topItems={stats.topItems}
    />
  );
}

export default function ManagerDashboardPage() {
  return (
    <ProtectedRoute roles={["manager"]}>
      <ManagerDashboardData />
    </ProtectedRoute>
  );
}
