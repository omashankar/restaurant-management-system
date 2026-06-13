"use client";

import { raIconBadgeCls, raSpinnerCls, raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import dynamic from "next/dynamic";
import {
  BarChart3, DollarSign, RefreshCw,
  ShoppingBag, TrendingUp, Trophy,
} from "lucide-react";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { formatAdminMoney } from "@/lib/adminCurrency";
import TopItemsTable from "@/components/analytics/TopItemsTable";
import { useCallback, useEffect, useRef, useState } from "react";

const TenantAnalyticsCharts = dynamic(
  () => import("@/components/analytics/TenantAnalyticsCharts"),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl admin-surface-card" />
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
    <div className="min-w-0 admin-surface-card p-4 sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          <p className={`mt-2 break-all text-xl font-bold tabular-nums sm:text-2xl ${c.val}`}>{value}</p>
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

function AnalyticsPageSkeleton() {
  return (
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 animate-pulse rounded-lg admin-progress-track" />
          <div className="h-4 w-64 max-w-full animate-pulse rounded admin-progress-track" />
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-52" />
          <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-24" />
        </div>
      </div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl admin-surface-card" />
        ))}
      </div>
      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl admin-surface-card" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-2xl admin-surface-card" />
    </div>
  );
}

export default function AnalyticsPage() {
  const { formatDate } = useAdminLocale();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [range, setRange]   = useState("30");
  const hadDataRef = useRef(false);

  const fetchAnalytics = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setFetchError(null);
    try {
      const res  = await fetch(`/api/analytics?range=${range}`, { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
        hadDataRef.current = true;
      } else {
        setFetchError(json?.error ?? "Could not load analytics.");
        if (!silent) setData(null);
      }
    } catch {
      setFetchError("Network error while loading analytics.");
      if (!silent) setData(null);
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics(hadDataRef.current);
  }, [fetchAnalytics]);

  const refreshAnalytics = useCallback(async () => {
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full overflow-x-hidden">
        <AnalyticsPageSkeleton />
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
    label: formatDate(d.date, { style: "short" }),
  }));

  return (
    <div className={`min-w-0 w-full max-w-full space-y-6 overflow-x-hidden transition-opacity duration-200 ${refreshing ? "opacity-70" : ""}`}>

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <BarChart3 className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Analytics</h1>
            <p className="admin-page-desc mt-1 break-words text-sm">Revenue, orders, and performance insights.</p>
          </div>
        </div>
        <div className="admin-page-header-actions">
          <div
            className="admin-surface-segment-track flex w-full min-w-0 overflow-x-auto p-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:w-auto [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                aria-pressed={range === r.value}
                className={`min-h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-lg border border-transparent px-3 py-2 text-xs font-semibold transition-[background-color,color] ${
                  range === r.value
                    ? "bg-ra-primary text-zinc-950"
                    : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={refreshAnalytics}
            disabled={refreshing}
            className={raPageRefreshBtnCls}
          >
            <RefreshCw className={`size-4 ${refreshing ? raSpinnerCls : ""}`} />
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
