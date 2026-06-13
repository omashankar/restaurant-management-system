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
import { raIconBadgeCls, raPageRefreshBtnCls, raSpinnerCls } from "@/config/restaurantAdminTheme";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { usePermission } from "@/hooks/usePermission";
import { LayoutDashboard, RefreshCw } from "lucide-react";

export default function MainDashboard() {
  const { hasPermission, role } = usePermission();
  const { formatTime } = useAdminLocale();
  const dashboard = useDashboardData();

  if (dashboard.loading) {
    return <DashboardLoading />;
  }

  return (
    <div className={`min-w-0 w-full max-w-full space-y-6 overflow-x-hidden transition-opacity duration-200 sm:space-y-8 ${dashboard.refreshing ? "opacity-70" : ""}`}>
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <LayoutDashboard className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">
              {role === "admin" ? "Command center" : "Shift overview"}
            </h1>
            <p className="admin-page-desc mt-1 break-words text-sm">
              {role === "admin"
                ? "Live snapshot of sales, orders, and floor activity."
                : "Live metrics for your shift."}
              {dashboard.lastUpdated && (
                <span className="mt-1 block sm:mt-0 sm:inline">
                  <span className="hidden sm:inline"> · </span>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-ra-accent" />
                    updated {formatTime(dashboard.lastUpdated, { seconds: true })}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="admin-page-header-actions">
        <button
          type="button"
          onClick={dashboard.refresh}
          disabled={dashboard.refreshing}
          className={raPageRefreshBtnCls}
        >
          <RefreshCw className={`size-4 ${dashboard.refreshing ? raSpinnerCls : ""}`} />
          Refresh
        </button>
        </div>
      </div>

      {dashboard.error && (
        <p className="break-words rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
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
        <div className="grid min-w-0 items-stretch gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="order-2 flex min-h-0 min-w-0 lg:order-1 lg:col-span-2">
            <SalesChart data={dashboard.salesChartData} />
          </div>
          <div className="order-1 flex min-h-0 min-w-0 lg:order-2">
            <QuickActions compact />
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
        <div className="grid min-w-0 items-stretch gap-4 sm:gap-6 lg:grid-cols-5">
          <div className="flex min-h-0 min-w-0 lg:col-span-2">
            <TopDishes items={dashboard.topItems} currency={dashboard.currency} />
          </div>
          <div className="flex min-h-0 min-w-0 lg:col-span-3">
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
