"use client";

import OrderCard from "@/components/rms/OrderCard";
import RevenueChart from "@/components/rms/RevenueChart";
import StatsCard from "@/components/rms/StatsCard";
import {
  recentOrders,
  revenueByDay,
  statsOverview,
} from "@/lib/mockData";
import { ArrowRight, DollarSign, ShoppingBag, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Command center
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live snapshot of sales, orders, and floor activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard
          title="Sales today"
          value={`$${statsOverview.salesToday.toLocaleString()}`}
          subtitle="Gross before fees"
          trend={statsOverview.salesChange}
          icon={DollarSign}
        />
        <StatsCard
          title="Orders"
          value={String(statsOverview.ordersToday)}
          subtitle="Covers + takeout"
          trend={statsOverview.ordersChange}
          icon={ShoppingBag}
        />
        <StatsCard
          title="Guests"
          value={String(statsOverview.customersToday)}
          subtitle="Unique check-ins"
          trend={statsOverview.customersChange}
          icon={Users}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <RevenueChart data={revenueByDay} />
        </div>
        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 lg:col-span-2">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Quick actions</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Shortcuts your managers use all shift.
            </p>
          </div>
          <div className="mt-6 space-y-2">
            {[
              { href: "/pos", label: "Open POS terminal" },
              { href: "/kitchen", label: "Kitchen display" },
              { href: "/reservations", label: "Tonight's holds" },
              { href: "/staff", label: "Staff roster" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3 text-sm font-medium text-zinc-200 transition-all duration-200 hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                {a.label}
                <ArrowRight className="size-4 text-zinc-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-100">Recent orders</h2>
          <Link
            href="/orders"
            className="text-sm font-medium text-emerald-400 transition-colors hover:text-emerald-300"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recentOrders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      </section>
    </div>
  );
}
