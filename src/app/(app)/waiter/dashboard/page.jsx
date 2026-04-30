"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import WaiterDashboard from "@/components/views/WaiterDashboard";
import { useEffect, useState } from "react";

function WaiterDashboardData() {
  const [tables, setTables]   = useState([]);
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tablesRes, ordersRes] = await Promise.all([
          fetch("/api/tables"),
          fetch("/api/orders"),
        ]);
        const [tablesData, ordersData] = await Promise.all([
          tablesRes.json(),
          ordersRes.json(),
        ]);
        if (tablesData.success) setTables(tablesData.tables ?? []);
        if (ordersData.success) setOrders(ordersData.orders ?? []);
      } catch {
        /* keep empty defaults */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
        <div className="h-48 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
      </div>
    );
  }

  return <WaiterDashboard tables={tables} orders={orders} />;
}

export default function WaiterDashboardPage() {
  return (
    <ProtectedRoute roles={["waiter"]}>
      <WaiterDashboardData />
    </ProtectedRoute>
  );
}
