"use client";

import RecentOrdersTable from "@/components/dashboard/RecentOrdersTable";
import StatsCard from "@/components/rms/StatsCard";
import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import { ClipboardList, ShoppingCart, Table2, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default function WaiterDashboard({ tables = [], orders = [] }) {
  const activeTables = tables.filter((t) => t.status === "occupied");
  const myOrders     = orders.filter((o) => (o.type ?? o.orderType) === "dine-in").slice(0, 5);
  const pending      = myOrders.filter((o) => o.status === "new" || o.status === "preparing").length;

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">My Shift</h1>
          <p className="admin-page-desc mt-1 break-words text-sm">Active tables, your orders, and quick actions.</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard title="Active Tables"   value={`${activeTables.length} / ${tables.length}`} subtitle="Occupied right now" icon={Table2} />
        <StatsCard title="My Orders Today" value={String(myOrders.length)}                      subtitle="Assigned to you"   icon={UtensilsCrossed} />
        <StatsCard title="Pending"         value={String(pending)}                              subtitle="Awaiting service"  icon={ShoppingCart} />
      </div>

      {/* Tables grid */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold admin-shell-text">Active Tables</h2>
          <Link href="/tables" className="cursor-pointer text-xs font-medium text-ra-primary hover:text-ra-primary-muted">View tables →</Link>
        </div>
        {tables.length === 0 ? (
          <p className="text-sm admin-surface-faint">No tables configured yet.</p>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tables.map((t) => (
              <div key={t.id ?? t.tableNumber}
                className={`min-w-0 rounded-2xl border p-4 ${t.status === "occupied" ? "border-sky-500/25 bg-sky-500/5" : "admin-surface-card"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="break-words text-lg font-semibold admin-shell-text">{t.tableNumber}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 capitalize ${
                    t.status === "occupied" ? "bg-sky-500/15 text-sky-300 ring-sky-500/25" : "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25"
                  }`}>{t.status}</span>
                </div>
                <p className="mt-1 break-words text-xs admin-surface-faint">{t.zone ?? ""} · {t.capacity} seats</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href="/pos" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto">
          <ShoppingCart className="size-4" /> New Order
        </Link>
        <Link href="/orders" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border admin-shell-border px-5 py-2.5 text-sm font-semibold admin-shell-text hover-border-ra-primary-40 sm:w-auto">
          View All Orders
        </Link>
      </div>

      <RecentOrdersTable orders={myOrders} />
    </div>
  );
}
