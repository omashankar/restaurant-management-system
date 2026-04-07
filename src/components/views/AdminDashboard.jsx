"use client";

import DashboardStats from "@/components/dashboard/DashboardStats";
import DonutChart from "@/components/dashboard/DonutChart";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import SalesChart from "@/components/dashboard/SalesChart";
import SalesComparison from "@/components/dashboard/SalesComparison";
import TopDishes from "@/components/dashboard/TopDishes";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Command center
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live snapshot of sales, orders, and floor activity.
        </p>
      </div>

      {/* 1. Top Stats — 4 cards */}
      <DashboardStats />

      {/* Sales Analytics (filterable chart) + Quick Actions */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart />
        </div>
        <QuickActions />
      </div>

      {/* 5. Revenue Comparison + Order Channels donut */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SalesComparison />
        <DonutChart />
      </div>

      {/* 6. Top Dishes + Recent Orders Table */}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <TopDishes />
        </div>
        <div className="xl:col-span-3">
          <RecentOrdersTable />
        </div>
      </div>
    </div>
  );
}
