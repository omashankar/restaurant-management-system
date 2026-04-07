"use client";

import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import SalesChart from "@/components/dashboard/SalesChart";
import TopDishes from "@/components/dashboard/TopDishes";
import RoleCard from "@/components/rms/RoleCard";
import StatsCard from "@/components/rms/StatsCard";
import { dashboardStats, inventoryAlerts } from "@/lib/mockData";
import { AlertTriangle, DollarSign, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboard() {
  return (
    <div className="space-y-8">
      {/* Scope banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-amber-200">Manager scope</p>
            <p className="mt-1 text-sm text-zinc-500">
              Some modules are view-only. Destructive actions are disabled for your role.
            </p>
          </div>
        </div>
        <Link
          href="/analytics"
          className="cursor-pointer shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-center text-sm font-medium text-zinc-200 transition-colors hover:border-emerald-500/40"
        >
          Open analytics
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Shift overview</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live metrics without sensitive HR controls.
        </p>
      </div>

      {/* Permission cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <RoleCard title="Full POS & orders" description="Create tickets, comps, and manage service flow." variant="allowed" />
        <RoleCard title="Limited reservations & CRM" description="View and edit within policy; exports may be restricted." variant="limited" />
        <RoleCard title="Inventory (read-focused)" description="Adjust par levels; supplier keys require admin." variant="limited" />
      </div>

      {/* Stats — no customer/reservation counts */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Sales Today"
          value={`$${dashboardStats.salesToday.toLocaleString()}`}
          subtitle="Gross before fees"
          trend={dashboardStats.salesChange}
          icon={DollarSign}
        />
        <StatsCard
          title="Orders Today"
          value={String(dashboardStats.ordersToday)}
          subtitle="Covers + takeout"
          trend={dashboardStats.ordersChange}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Low Stock Items"
          value={String(inventoryAlerts.length)}
          subtitle="Need reorder"
          icon={Package}
        />
      </div>

      {/* Sales chart */}
      <SalesChart />

      {/* Top dishes + recent orders */}
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
