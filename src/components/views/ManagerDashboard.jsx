"use client";

import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import SalesChart from "@/components/dashboard/SalesChart";
import TopDishes from "@/components/dashboard/TopDishes";
import RoleCard from "@/components/rms/RoleCard";
import StatsCard from "@/components/rms/StatsCard";
import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { AlertTriangle, BarChart3, DollarSign, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboard({
  currency = "INR",
  salesToday = 0,
  salesChange = 0,
  ordersToday = 0,
  ordersChange = 0,
  lowStockCount = 0,
  orders = [],
  topItems = [],
  salesChartData = {},
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="font-medium text-amber-200">Manager scope</p>
            <p className="mt-1 text-sm admin-surface-muted">Some modules are view-only. Destructive actions are disabled.</p>
          </div>
        </div>
        <Link href="/analytics" className="cursor-pointer shrink-0 rounded-xl border admin-shell-border px-4 py-2 text-center text-sm font-medium admin-shell-text hover-border-ra-primary-40">
          Open analytics
        </Link>
      </div>

      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
          <BarChart3 className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title">Shift overview</h1>
          <p className="mt-1 text-sm admin-surface-muted">Live metrics without sensitive HR controls.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RoleCard title="Full POS & orders"           description="Create tickets, comps, and manage service flow."                    variant="allowed" />
        <RoleCard title="Limited reservations & CRM"  description="View and edit within policy; exports may be restricted."            variant="limited" />
        <RoleCard title="Inventory (read-focused)"    description="Adjust par levels; supplier keys require admin."                    variant="limited" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Sales Today" value={formatAdminMoney(salesToday, currency)} subtitle="Calendar day" trend={salesChange} icon={DollarSign} />
        <StatsCard title="Orders Today"    value={String(ordersToday)}               subtitle="Covers + takeout"  trend={ordersChange} icon={ShoppingBag} />
        <StatsCard title="Low Stock Items" value={String(lowStockCount)}             subtitle="Need reorder"                           icon={Package} />
      </div>

      <SalesChart data={salesChartData} />

      <div className="grid items-stretch gap-6 xl:grid-cols-5">
        <div className="flex min-h-0 xl:col-span-2">
          <TopDishes items={topItems} currency={currency} />
        </div>
        <div className="flex min-h-0 xl:col-span-3">
          <RecentOrdersTable orders={orders} currency={currency} />
        </div>
      </div>
    </div>
  );
}
