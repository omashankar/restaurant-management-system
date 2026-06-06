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
    <div className="admin-surface-card p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          <p className={`mt-2 break-words text-xl font-bold sm:text-2xl ${c.val}`}>{value}</p>
          {subtitle && <p className="mt-1 text-xs leading-snug admin-surface-faint">{subtitle}</p>}
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
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse admin-surface-card" />
          ))}
        </div>
        <div className="grid min-w-0 gap-6 lg:grid-cols-2">
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
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <BarChart3 className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Analytics</h1>
            <p className="admin-page-desc mt-1 text-sm">Revenue, orders, and performance insights.</p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="flex min-w-0 overflow-x-auto rounded-xl border admin-shell-border p-0.5 [scrollbar-width:none]">
            {RANGES.map((r) => (
              <button key={r.value} type="button" onClick={() => setRange(r.value)}
                className={`shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  range === r.value ? "bg-ra-primary text-zinc-950" : "text-zinc-500 hover:admin-surface-body"
                }`}>
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={fetchAnalytics}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border admin-shell-border px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:admin-shell-text sm:w-auto">
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
