"use client";

import Can from "@/components/rbac/Can";
import AnalyticsFilters from "@/components/analytics/AnalyticsFilters";
import BestDayChart from "@/components/analytics/BestDayChart";
import CategoryPerformance from "@/components/analytics/CategoryPerformance";
import ComparisonChart from "@/components/analytics/ComparisonChart";
import CustomerChart from "@/components/analytics/CustomerChart";
import HourlyOrdersChart from "@/components/analytics/HourlyOrdersChart";
import InventoryInsights from "@/components/analytics/InventoryInsights";
import SmartInsights from "@/components/analytics/SmartInsights";
import TopItemsTable from "@/components/analytics/TopItemsTable";
import DonutChart from "@/components/dashboard/DonutChart";
import StatsCard from "@/components/rms/StatsCard";
import { usePermission } from "@/hooks/usePermission";
import { analyticsKpis } from "@/lib/mockData";
import { DollarSign, Percent, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useState } from "react";

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("This Month");
  const [orderType, setOrderType] = useState("All");
  const { hasPermission } = usePermission();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Revenue, orders, customers, and performance insights.
        </p>
      </div>

      {/* Filters — export button inside is gated by export_reports */}
      <AnalyticsFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        orderType={orderType}
        setOrderType={setOrderType}
        canExport={hasPermission("export_reports")}
      />

      {/* KPI row — financial KPIs gated by view_sales */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Can permission="view_sales">
          <StatsCard
            title="Total Revenue"
            value={`$${(analyticsKpis.totalRevenue / 1000).toFixed(1)}k`}
            subtitle={dateRange}
            trend={analyticsKpis.revenueChange}
            icon={DollarSign}
          />
        </Can>

        <StatsCard
          title="Total Orders"
          value={analyticsKpis.totalOrders.toLocaleString()}
          subtitle={dateRange}
          trend={analyticsKpis.ordersChange}
          icon={ShoppingBag}
        />

        <Can permission="view_sales">
          <StatsCard
            title="Avg Order Value"
            value={`$${analyticsKpis.avgOrderValue}`}
            subtitle="Per transaction"
            trend={analyticsKpis.avgOrderChange}
            icon={TrendingUp}
          />
        </Can>

        <Can permission="view_customers">
          <StatsCard
            title="New Customers"
            value={String(analyticsKpis.newCustomers)}
            subtitle={dateRange}
            trend={analyticsKpis.newCustomersChange}
            icon={Users}
          />
        </Can>

        <Can permission="view_customers">
          <StatsCard
            title="Return Rate"
            value={`${analyticsKpis.returningRate}%`}
            subtitle="Repeat guests"
            trend={analyticsKpis.returningChange}
            icon={Percent}
          />
        </Can>
      </div>

      {/* Smart Insights */}
      <Can permission="view_analytics">
        <SmartInsights />
      </Can>

      {/* Revenue comparison + Hourly orders */}
      <Can permission="view_sales">
        <div className="grid gap-6 lg:grid-cols-2">
          <ComparisonChart />
          <HourlyOrdersChart />
        </div>
      </Can>

      {/* Customer analytics + Sales channels */}
      <Can permission="view_analytics">
        <div className="grid gap-6 lg:grid-cols-2">
          <CustomerChart />
          <DonutChart />
        </div>
      </Can>

      {/* Top items + Category performance — visible to anyone with view_orders */}
      <Can permission="view_orders">
        <div className="grid gap-6 lg:grid-cols-2">
          <TopItemsTable />
          <CategoryPerformance />
        </div>
      </Can>

      {/* Best day + Inventory insights */}
      <Can permission="view_analytics">
        <BestDayChart />
      </Can>

      <Can permission="view_inventory">
        <InventoryInsights />
      </Can>
    </div>
  );
}
