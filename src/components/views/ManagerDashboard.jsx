"use client";

import RoleCard from "@/components/rms/RoleCard";
import OrderCard from "@/components/rms/OrderCard";
import RevenueChart from "@/components/rms/RevenueChart";
import StatsCard from "@/components/rms/StatsCard";
import {
  recentOrders,
  revenueByDay,
  statsOverview,
} from "@/lib/mockData";
import { AlertTriangle, DollarSign, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";

export default function ManagerDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <p className="font-medium text-amber-200">Manager scope</p>
            <p className="mt-1 text-sm text-zinc-500">
              Some modules are view-only or limited. Destructive actions (e.g.
              delete staff) are disabled for your role.
            </p>
          </div>
        </div>
        <Link
          href="/analytics"
          className="shrink-0 rounded-xl border border-zinc-700 px-4 py-2 text-center text-sm font-medium text-zinc-200 transition-colors hover:border-emerald-500/40"
        >
          Open analytics
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Shift overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Same live metrics as admin, without sensitive HR controls.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <RoleCard
          title="Full POS & orders"
          description="Create tickets, comps, and manage service flow."
          variant="allowed"
        />
        <RoleCard
          title="Limited reservations & CRM"
          description="View and edit within policy; exports may be restricted."
          variant="limited"
        />
        <RoleCard
          title="Inventory (read-focused)"
          description="Adjust par levels; supplier keys require admin."
          variant="limited"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Sales today"
          value={`$${statsOverview.salesToday.toLocaleString()}`}
          trend={statsOverview.salesChange}
          icon={DollarSign}
        />
        <StatsCard
          title="Orders"
          value={String(statsOverview.ordersToday)}
          trend={statsOverview.ordersChange}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Guests"
          value={String(statsOverview.customersToday)}
          trend={statsOverview.customersChange}
          icon={Users}
        />
      </div>

      <RevenueChart data={revenueByDay} />

      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-100">
          Recent orders
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recentOrders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      </section>
    </div>
  );
}
