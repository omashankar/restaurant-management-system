"use client";

import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import SalesChart from "@/components/dashboard/SalesChart";
import TopDishes from "@/components/dashboard/TopDishes";
import RoleCard from "@/components/rms/RoleCard";
import StatsCard from "@/components/rms/StatsCard";
import { AlertTriangle, DollarSign, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboard({
  salesToday = 0,
  salesChange = 0,
  ordersToday = 0,
  ordersChange = 0,
  lowStockCount = 0,
  orders = [],
  topItems = [],
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
            <p className="mt-1 text-sm text-zinc-500">Some modules are view-only. Destructive actions are disabled.</p>
          </div>
        </div>
        <Link href="/analytics" className="cursor-pointer shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-center text-sm font-medium text-zinc-200 hover:border-emerald-500/40">
          Open analytics
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Shift overview</h1>
        <p className="mt-1 text-sm text-zinc-500">Live metrics without sensitive HR controls.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RoleCard title="Full POS & orders"           description="Create tickets, comps, and manage service flow."                    variant="allowed" />
        <RoleCard title="Limited reservations & CRM"  description="View and edit within policy; exports may be restricted."            variant="limited" />
        <RoleCard title="Inventory (read-focused)"    description="Adjust par levels; supplier keys require admin."                    variant="limited" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Sales Today"     value={`$${salesToday.toLocaleString()}`} subtitle="Gross before fees" trend={salesChange}  icon={DollarSign} />
        <StatsCard title="Orders Today"    value={String(ordersToday)}               subtitle="Covers + takeout"  trend={ordersChange} icon={ShoppingBag} />
        <StatsCard title="Low Stock Items" value={String(lowStockCount)}             subtitle="Need reorder"                           icon={Package} />
      </div>

      <SalesChart />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2"><TopDishes items={topItems} /></div>
        <div className="xl:col-span-3"><RecentOrdersTable orders={orders} /></div>
      </div>
    </div>
  );
}
