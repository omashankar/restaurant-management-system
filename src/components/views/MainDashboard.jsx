"use client";

import Can from "@/components/rbac/Can";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DonutChart from "@/components/dashboard/DonutChart";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import SalesChart from "@/components/dashboard/SalesChart";
import SalesComparison from "@/components/dashboard/SalesComparison";
import TopDishes from "@/components/dashboard/TopDishes";
import { usePermission } from "@/hooks/usePermission";

/**
 * Single unified dashboard for Admin + Manager.
 * Every section is gated by permission — no role checks, no duplication.
 */
export default function MainDashboard() {
  const { hasPermission, role } = usePermission();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          {role === "admin" ? "Command center" : "Shift overview"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {role === "admin"
            ? "Live snapshot of sales, orders, and floor activity."
            : "Live metrics for your shift."}
        </p>
      </div>

      {/* Stats row — each card self-gates internally */}
      <DashboardStats />

      {/* Sales chart + Quick Actions */}
      <Can permission="view_sales">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <SalesChart />
          </div>
          <QuickActions />
        </div>
      </Can>

      {/* If no view_sales, still show quick actions alone */}
      {!hasPermission("view_sales") && (
        <QuickActions />
      )}

      {/* Revenue comparison + Order channels — financial data */}
      <Can permission="view_analytics">
        <div className="grid gap-6 lg:grid-cols-2">
          <SalesComparison />
          <DonutChart />
        </div>
      </Can>

      {/* Top dishes — visible to anyone who can view orders */}
      <Can permission="view_orders">
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <TopDishes />
          </div>
          <div className="xl:col-span-3">
            <RecentOrdersTable />
          </div>
        </div>
      </Can>
    </div>
  );
}
