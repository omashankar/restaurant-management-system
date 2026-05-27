"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ManagerDashboard from "@/components/views/ManagerDashboard";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import { useDashboardData } from "@/hooks/useDashboardData";

function ManagerDashboardData() {
  const dashboard = useDashboardData();

  if (dashboard.loading) {
    return <DashboardLoading />;
  }

  return (
    <ManagerDashboard
      currency={dashboard.currency}
      salesToday={dashboard.salesToday}
      ordersToday={dashboard.ordersToday}
      lowStockCount={dashboard.lowStockCount}
      orders={dashboard.orders}
      topItems={dashboard.topItems}
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
