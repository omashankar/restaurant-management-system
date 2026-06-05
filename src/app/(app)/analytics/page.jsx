"use client";

import { raIconBadgeCls } from "@/config/restaurantAdminTheme";
import dynamic from "next/dynamic";
import {
  BarChart3, DollarSign, RefreshCw,
  ShoppingBag, TrendingUp, Trophy,
} from "lucide-react";
import { formatAdminMoney } from "@/lib/adminCurrency";
import TopItemsTable from "@/components/analytics/TopItemsTable";
import { useCallback, useEffect, useState } from "react";

const TenantAnalyticsCharts = dynamic(
  () => import("@/components/analytics/TenantAnalyticsCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse admin-surface-card" />
        ))}
      </div>
    ),
  }
);

/* ── KPI card ── */
function KpiCard({ title, value, subtitle, icon: Icon, color = "emerald" }) {
  const colors = {
    emerald: { bg: "bg-ra-primary-10", ring: "ring-ra-primary-20", icon: "text-ra-primary", val: "text-ra-primary" },
    indigo:  { bg: "bg-indigo-500/10",  ring: "ring-indigo-500/20",  icon: "text-indigo-400",  val: "text-indigo-400"  },
    amber:   { bg: "bg-amber-500/10",   ring: "ring-amber-500/20",   icon: "text-amber-400",   val: "text-amber-400"   },
    sky:     { bg: "bg-sky-500/10",     ring: "ring-sky-500/20",     icon: "text-sky-400",     val: "text-sky-400"     },
  };
  const c = colors[color] ?? colors.emerald;
  return (
    <div className="admin-surface-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          <p className={`mt-2 text-2xl font-bold ${c.val}`}>{value}</p>
          {subtitle && <p className="mt-1 text-xs admin-surface-faint">{subtitle}</p>}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${c.bg} ${c.ring}`}>
          <Icon className={`size-5 ${c.icon}`} />
        </span>
      </div>
    </div>
  );
}

const RANGES = [
  { label: "7 days",  value: "7"  },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

export default function AnalyticsPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [range, setRange]   = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res  = await fetch(`/api/analytics?range=${range}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        setFetchError(json?.error ?? "Could not load analytics.");
        setData(null);
      }
    } catch {
      setFetchError("Network error while loading analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse admin-surface-card" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse admin-surface-card" />
          ))}
        </div>
      </div>
    );
  }

  const currency    = data?.currency ?? "INR";
  const kpis        = data?.kpis        ?? {};
  const topItems    = data?.topItems    ?? [];
  const dailyRev    = data?.dailyRevenue ?? [];
  const orderTypes  = data?.ordersByType ?? [];
  const fmt = (n) => formatAdminMoney(n, currency);

  const chartData = dailyRev.map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-6">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`mt-1 ${raIconBadgeCls}`}>
            <BarChart3 className="size-5" />
          </span>
          <div>
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="admin-page-desc mt-1 text-sm">Revenue, orders, and performance insights.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border admin-shell-border p-0.5">
            {RANGES.map((r) => (
              <button key={r.value} type="button" onClick={() => setRange(r.value)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  range === r.value ? "bg-ra-primary text-zinc-950" : "text-zinc-500 hover:admin-surface-body"
                }`}>
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={fetchAnalytics}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:admin-shell-text transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Revenue"   value={fmt(kpis.totalRevenue ?? 0)}  subtitle={`Last ${range} days · non-cancelled`} icon={DollarSign}  color="emerald" />
        <KpiCard title="Total Orders"    value={kpis.totalOrders?.toLocaleString() ?? 0}          subtitle={`Last ${range} days`} icon={ShoppingBag} color="indigo"  />
        <KpiCard title="Avg Order Value" value={fmt(kpis.avgOrderValue ?? 0)}   subtitle="Per order (non-cancelled)"      icon={TrendingUp}  color="amber"   />
        <KpiCard title="Fulfilled"       value={kpis.completedOrders?.toLocaleString() ?? 0}      subtitle={`${kpis.cancelledOrders ?? 0} cancelled`} icon={Trophy} color="sky" />
      </div>

      <TenantAnalyticsCharts chartData={chartData} topItems={topItems} orderTypes={orderTypes} currency={currency} />

      <TopItemsTable items={topItems} formatMoney={fmt} />

    </div>
  );
}
