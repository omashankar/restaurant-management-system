"use client";

import AiInsights from "@/components/dashboard/AiInsights";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DonutChart from "@/components/dashboard/DonutChart";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import SalesChart from "@/components/dashboard/SalesChart";
import SalesComparison from "@/components/dashboard/SalesComparison";
import SmartMetrics from "@/components/dashboard/SmartMetrics";
import TopDishes from "@/components/dashboard/TopDishes";
import Can from "@/components/rbac/Can";
import { adminSurface } from "@/config/adminSurfaceClasses";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePermission } from "@/hooks/usePermission";
import { RefreshCw } from "lucide-react";

export default function MainDashboard() {
  const { hasPermission, role } = usePermission();
  const dashboard = useDashboardData();

  if (dashboard.loading) {
    return <DashboardLoading />;
  }

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className={adminSurface.heading}>
            {role === "admin" ? "Command center" : "Shift overview"}
          </h1>
          <p className={`mt-1 text-sm ${adminSurface.muted}`}>
            {role === "admin"
              ? "Live snapshot of sales, orders, and floor activity."
              : "Live metrics for your shift."}
            {dashboard.lastUpdated && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-ra-accent" />
                  updated {dashboard.lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dashboard.refresh}
          className={`inline-flex w-full items-center justify-center gap-2 sm:w-auto ${adminSurface.btnGhost} hover-border-ra-primary-40`}
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      {dashboard.error && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {dashboard.error}
        </p>
      )}

      <DashboardStats
        currency={dashboard.currency}
        salesToday={dashboard.salesToday}
        ordersToday={dashboard.ordersToday}
        customerCount={dashboard.customerCount}
        reservationsToday={dashboard.reservationsToday}
        reservationsCalendarDate={dashboard.reservationsCalendarDate}
      />

      <Can permission="view_sales">
        <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-3">
          <div className="flex min-h-0 xl:col-span-2">
            <SalesChart data={dashboard.salesChartData} />
          </div>
          <div className="flex min-h-0">
            <QuickActions />
          </div>
        </div>
      </Can>

      {!hasPermission("view_sales") && <QuickActions />}

      <Can permission="view_analytics">
        <SmartMetrics {...dashboard.smartMetrics} />
      </Can>

      <Can permission="view_analytics">
        <div className="grid min-w-0 items-stretch gap-6 lg:grid-cols-2">
          <div className="flex min-h-0">
            <SalesComparison
              currency={dashboard.currency}
              current={dashboard.salesComparison.current}
              previous={dashboard.salesComparison.previous}
              monthly={dashboard.salesComparison.monthly}
            />
          </div>
          <div className="flex min-h-0">
            <DonutChart channels={dashboard.ordersByType} />
          </div>
        </div>
      </Can>

      <Can permission="view_orders">
        <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-5">
          <div className="flex min-h-0 xl:col-span-2">
            <TopDishes items={dashboard.topItems} currency={dashboard.currency} />
          </div>
          <div className="flex min-h-0 xl:col-span-3">
            <RecentOrdersTable orders={dashboard.orders} currency={dashboard.currency} />
          </div>
        </div>
      </Can>

      <Can permission="view_analytics">
        <AiInsights insights={dashboard.insights} />
      </Can>
    </div>
  );
}
