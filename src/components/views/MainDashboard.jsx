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
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
            {role === "admin" ? "Command center" : "Shift overview"}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {role === "admin"
              ? "Live snapshot of sales, orders, and floor activity."
              : "Live metrics for your shift."}
            {dashboard.lastUpdated && (
              <>
                {" · "}
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                  updated {dashboard.lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={dashboard.refresh}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-zinc-100"
        >
          <RefreshCw className="size-4" />
          Refresh
        </button>
      </div>

      {dashboard.error && (
        <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
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
        <div className="grid items-stretch gap-6 xl:grid-cols-3">
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
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
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
        <div className="grid items-stretch gap-6 xl:grid-cols-5">
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
