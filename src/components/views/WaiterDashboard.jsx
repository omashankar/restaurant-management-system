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
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden pb-24 sm:space-y-8 md:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
          <ClipboardList className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">My Shift</h1>
          <p className="admin-page-desc mt-1 break-words text-sm">Active tables, your orders, and quick actions.</p>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        <StatsCard title="Active Tables"   value={`${activeTables.length} / ${tables.length}`} subtitle="Occupied right now" icon={Table2} />
        <StatsCard title="My Orders Today" value={String(myOrders.length)}                      subtitle="Assigned to you"   icon={UtensilsCrossed} />
        <StatsCard title="Pending"         value={String(pending)}                              subtitle="Awaiting service"  icon={ShoppingCart} className="sm:col-span-2 lg:col-span-1" />
      </div>

      {/* Tables grid */}
      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <h2 className="text-sm font-semibold admin-shell-text">Active Tables</h2>
          <Link href="/tables" className="cursor-pointer shrink-0 text-xs font-medium text-ra-primary hover:text-ra-primary-muted">View tables →</Link>
        </div>
        {tables.length === 0 ? (
          <p className="text-sm admin-surface-faint">No tables configured yet.</p>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[380px]:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tables.map((t) => (
              <Link
                key={t.id ?? t.tableNumber}
                href="/pos"
                className={`min-w-0 rounded-2xl border p-3.5 transition-colors hover:border-ra-primary-40 sm:p-4 ${
                  t.status === "occupied" ? "border-sky-500/25 bg-sky-500/5" : "admin-surface-card"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 break-words text-base font-semibold admin-shell-text sm:text-lg">{t.tableNumber}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 capitalize sm:px-2.5 sm:text-xs ${
                    t.status === "occupied" ? "bg-sky-500/15 text-sky-300 ring-sky-500/25" : "bg-ra-primary-15 text-ra-primary-muted ring-ra-primary-25"
                  }`}>{t.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 break-words text-[11px] admin-surface-faint sm:text-xs">
                  {[t.zone, t.capacity ? `${t.capacity} seats` : ""].filter(Boolean).join(" · ")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="hidden min-w-0 flex-col gap-3 md:flex md:flex-row md:flex-wrap">
        <Link href="/pos" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 md:w-auto">
          <ShoppingCart className="size-4" /> New Order
        </Link>
        <Link href="/orders" className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border admin-shell-border px-5 py-2.5 text-sm font-semibold admin-shell-text hover-border-ra-primary-40 md:w-auto">
          View All Orders
        </Link>
      </div>

      <RecentOrdersTable orders={myOrders} />

      {/* Mobile sticky quick actions — always reachable while scrolling tables */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t admin-shell-border bg-[var(--admin-elevated)]/95 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md md:hidden sm:px-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg gap-2">
          <Link
            href="/pos"
            className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 active:scale-[0.99]"
          >
            <ShoppingCart className="size-4 shrink-0" aria-hidden />
            <span className="truncate">New Order</span>
          </Link>
          <Link
            href="/orders"
            className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border admin-shell-border px-4 py-2.5 text-sm font-semibold admin-shell-text hover-border-ra-primary-40 active:scale-[0.99]"
          >
            <span className="truncate">All Orders</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
