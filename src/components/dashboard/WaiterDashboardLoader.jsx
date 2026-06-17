"use client";

import WaiterDashboard from "@/components/views/WaiterDashboard";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { useCallback, useEffect, useState } from "react";

export default function WaiterDashboardLoader() {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch("/api/tables", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ]);
      const [tablesData, ordersData] = await Promise.all([
        tablesRes.json(),
        ordersRes.json(),
      ]);
      if (tablesData.success) setTables(tablesData.tables ?? []);
      if (ordersData.success) setOrders(ordersData.orders ?? []);
    } catch {
      /* keep previous data on silent refresh failure */
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useLiveRefresh(load);

  if (loading) {
    return (
      <div className="min-w-0 space-y-6 overflow-x-hidden pb-24 sm:space-y-8 md:pb-0">
        <div className="space-y-2">
          <div className="h-8 w-40 max-w-full animate-pulse rounded-lg admin-progress-track" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded admin-progress-track" />
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl admin-surface-card" />
          ))}
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl admin-surface-card sm:h-24" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl admin-surface-card" />
      </div>
    );
  }

  return <WaiterDashboard tables={tables} orders={orders} />;
}
