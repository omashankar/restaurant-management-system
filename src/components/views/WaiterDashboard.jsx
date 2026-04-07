"use client";

import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import StatsCard from "@/components/rms/StatsCard";
import { recentOrdersTable } from "@/lib/mockData";
import { INITIAL_FLOOR_TABLES } from "@/lib/modulesData";
import { ShoppingCart, Table2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

const activeTables = INITIAL_FLOOR_TABLES.filter((t) => t.status === "occupied");
const myOrders = recentOrdersTable.filter((o) => o.type === "dine-in").slice(0, 5);

export default function WaiterDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          My Shift
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Active tables, your orders, and quick actions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          title="Active Tables"
          value={`${activeTables.length} / ${INITIAL_FLOOR_TABLES.length}`}
          subtitle="Occupied right now"
          icon={Table2}
        />
        <StatsCard
          title="My Orders Today"
          value={String(myOrders.length)}
          subtitle="Assigned to you"
          icon={UtensilsCrossed}
        />
        <StatsCard
          title="Pending"
          value={String(myOrders.filter((o) => o.status === "new" || o.status === "preparing").length)}
          subtitle="Awaiting service"
          icon={ShoppingCart}
        />
      </div>

      {/* Active tables grid */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-zinc-100">Active Tables</h2>
          <Link href="/tables" className="cursor-pointer text-xs font-medium text-emerald-400 hover:text-emerald-300">
            Floor map →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {INITIAL_FLOOR_TABLES.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl border p-4 ${
                t.status === "occupied"
                  ? "border-sky-500/25 bg-sky-500/5"
                  : "border-zinc-800 bg-zinc-900/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-lg font-semibold text-zinc-50">{t.tableNumber}</p>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize ${
                    t.status === "occupied"
                      ? "bg-sky-500/15 text-sky-300 ring-sky-500/25"
                      : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{t.zone} · {t.capacity} seats</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick action */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/pos"
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
        >
          <ShoppingCart className="size-4" />
          New Order
        </Link>
        <Link
          href="/orders"
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:border-emerald-500/40"
        >
          View All Orders
        </Link>
      </div>

      {/* Recent orders */}
      <RecentOrdersTable />
    </div>
  );
}
