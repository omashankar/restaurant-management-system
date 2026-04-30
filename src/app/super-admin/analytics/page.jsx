"use client";

import { useToast } from "@/hooks/useToast";
import {
  Activity, BarChart3, Building2, CreditCard,
  DollarSign, RefreshCw, TrendingUp, Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ─────────────────────────────────────────
   SHARED HELPERS
───────────────────────────────────────── */
const PLAN_COLOR = {
  free:       { bar: "bg-zinc-500",   badge: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25"       },
  starter:    { bar: "bg-sky-500",    badge: "bg-sky-500/15 text-sky-400 ring-sky-500/25"           },
  pro:        { bar: "bg-indigo-500", badge: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25"  },
  enterprise: { bar: "bg-amber-500",  badge: "bg-amber-500/15 text-amber-400 ring-amber-500/25"     },
};

const STATUS_COLOR = {
  paid:    "bg-emerald-500",
  pending: "bg-amber-500",
  failed:  "bg-red-500",
  refunded:"bg-zinc-500",
};

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, bg, border }) {
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-zinc-600">{sub}</p>}
        </div>
        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`size-5 ${color}`} />
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   BAR CHART (custom, no lib needed)
───────────────────────────────────────── */
function BarChart({ data, valueKey = "value", labelKey = "label", color = "bg-emerald-500", height = 160, prefix = "" }) {
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(2, ((d[valueKey] ?? 0) / max) * 100);
        return (
          <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] font-semibold text-zinc-200 shadow-lg group-hover:flex">
              {prefix}{(d[valueKey] ?? 0).toLocaleString()}
            </div>
            <div className="flex w-full flex-1 flex-col justify-end">
              <div
                className={`w-full rounded-t-md ${color} opacity-70 transition-all duration-300 hover:opacity-100`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <p className="w-full truncate text-center text-[9px] leading-tight text-zinc-600">
              {/* Show only month abbreviation to save space */}
              {d[labelKey]?.split(" ")[0]}
            </p>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   DONUT CHART (SVG)
───────────────────────────────────────── */
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const r = 40;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  const slices = segments.reduce((acc, seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const prevOffset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    acc.push({ ...seg, dash, gap, offset: prevOffset });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth={18} />
      {slices.map((s, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={s.color}
          strokeWidth={18}
          strokeDasharray={`${s.dash} ${s.gap}`}
          strokeDashoffset={-s.offset}
          className="transition-all duration-500"
        />
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function SuperAdminAnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast, ToastUI } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/super-admin/analytics");
      const json = await res.json();
      if (json.success) setData(json);
      else showToast(json.error ?? "Failed to load analytics.", "error");
    } catch {
      showToast("Network error.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  /* ── Plan donut segments ── */
  const PLAN_DONUT_COLORS = {
    free: "#71717a", starter: "#38bdf8", pro: "#818cf8", enterprise: "#fbbf24",
  };
  const planSegments = (data?.planBreakdown ?? []).map((p) => ({
    label: p.plan,
    value: p.count,
    color: PLAN_DONUT_COLORS[p.plan] ?? "#6b7280",
  }));

  /* ── Payment status donut ── */
  const STATUS_DONUT_COLORS = {
    paid: "#34d399", pending: "#fbbf24", failed: "#f87171", refunded: "#71717a",
  };
  const statusSegments = (data?.paymentStatus ?? []).map((p) => ({
    label: p.status,
    value: p.count,
    color: STATUS_DONUT_COLORS[p.status] ?? "#6b7280",
  }));

  const ov = data?.overview ?? {};

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/25">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Analytics</h1>
            <p className="mt-1 text-sm text-zinc-500">Platform-wide performance and growth metrics.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2.5 text-sm font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Skeleton ── */}
      {loading && !data && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
            ))}
          </div>
        </div>
      )}

      {data && (
        <>
          {/* ── Overview stat cards ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Restaurants" value={ov.totalRestaurants ?? 0}
              sub={`${ov.activeRestaurants ?? 0} active`}
              icon={Building2} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/20"
            />
            <StatCard
              label="Total Revenue" value={`$${(ov.totalRevenue ?? 0).toLocaleString()}`}
              sub={`${ov.totalPayments ?? 0} transactions`}
              icon={DollarSign} color="text-indigo-400" bg="bg-indigo-500/5" border="border-indigo-500/20"
            />
            <StatCard
              label="Total Users" value={ov.totalUsers ?? 0}
              sub={`${ov.totalAdmins ?? 0} restaurant admins`}
              icon={Users} color="text-amber-400" bg="bg-amber-500/5" border="border-amber-500/20"
            />
            <StatCard
              label="Active Subscriptions" value={ov.activeSubsCount ?? 0}
              sub="Currently active plans"
              icon={CreditCard} color="text-sky-400" bg="bg-sky-500/5" border="border-sky-500/20"
            />
          </div>

          {/* ── Revenue chart + Restaurant growth ── */}
          <div className="grid gap-4 lg:grid-cols-2">

            {/* Revenue by month */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="mb-5 flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Revenue — Last 12 Months</h2>
              </div>
              {(data.revenueByMonth ?? []).length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm text-zinc-600">No revenue data yet.</p>
                </div>
              ) : (
                <BarChart
                  data={data.revenueByMonth}
                  valueKey="value"
                  labelKey="label"
                  color="bg-emerald-500"
                  height={160}
                  prefix="$"
                />
              )}
            </div>

            {/* Restaurant growth */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="mb-5 flex items-center gap-2">
                <Activity className="size-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-zinc-100">Restaurant Growth — Last 12 Months</h2>
              </div>
              {(data.restaurantGrowth ?? []).length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm text-zinc-600">No data yet.</p>
                </div>
              ) : (
                <BarChart
                  data={data.restaurantGrowth}
                  valueKey="value"
                  labelKey="label"
                  color="bg-indigo-500"
                  height={160}
                />
              )}
            </div>
          </div>

          {/* ── Plan distribution + Payment status + Top restaurants ── */}
          <div className="grid gap-4 lg:grid-cols-3">

            {/* Plan distribution */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-4 text-sm font-semibold text-zinc-100">Plan Distribution</h2>
              <div className="flex items-center gap-5">
                <DonutChart segments={planSegments} size={100} />
                <div className="flex-1 space-y-2">
                  {(data.planBreakdown ?? []).map((p) => {
                    const total = (data.planBreakdown ?? []).reduce((s, x) => s + x.count, 0) || 1;
                    const pct   = Math.round((p.count / total) * 100);
                    const c     = PLAN_COLOR[p.plan] ?? PLAN_COLOR.free;
                    return (
                      <div key={p.plan}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${c.badge}`}>
                            {p.plan}
                          </span>
                          <span className="text-[10px] text-zinc-500">{p.count} · {pct}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-zinc-800">
                          <div className={`h-1 rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(data.planBreakdown ?? []).length === 0 && (
                    <p className="text-xs text-zinc-600">No data yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment status */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-4 text-sm font-semibold text-zinc-100">Payment Status</h2>
              <div className="flex items-center gap-5">
                <DonutChart segments={statusSegments} size={100} />
                <div className="flex-1 space-y-2.5">
                  {(data.paymentStatus ?? []).map((p) => {
                    const total = (data.paymentStatus ?? []).reduce((s, x) => s + x.count, 0) || 1;
                    const pct   = Math.round((p.count / total) * 100);
                    return (
                      <div key={p.status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${STATUS_COLOR[p.status] ?? "bg-zinc-500"}`} />
                          <span className="text-xs capitalize text-zinc-400">{p.status}</span>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-zinc-300">
                          {p.count} <span className="font-normal text-zinc-600">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                  {(data.paymentStatus ?? []).length === 0 && (
                    <p className="text-xs text-zinc-600">No payments yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top restaurants */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="mb-4 text-sm font-semibold text-zinc-100">Top Restaurants by Revenue</h2>
              {(data.topRestaurants ?? []).length === 0 ? (
                <p className="text-xs text-zinc-600">No revenue data yet.</p>
              ) : (
                <ol className="space-y-3">
                  {data.topRestaurants.map((r, i) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-200">{r.restaurantName}</p>
                        <p className="text-[10px] text-zinc-600">{r.txCount} transaction{r.txCount !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-400">
                        ${r.revenue.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* ── Quick summary row ── */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Avg Revenue / Restaurant</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-100">
                ${ov.totalRestaurants
                  ? Math.round((ov.totalRevenue ?? 0) / ov.totalRestaurants).toLocaleString()
                  : 0}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Rate</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-100">
                {ov.totalRestaurants
                  ? Math.round(((ov.activeRestaurants ?? 0) / ov.totalRestaurants) * 100)
                  : 0}%
              </p>
              <p className="mt-1 text-xs text-zinc-600">of restaurants are active</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Inactive Restaurants</p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-red-400">
                {ov.inactiveRestaurants ?? 0}
              </p>
              <p className="mt-1 text-xs text-zinc-600">need attention</p>
            </div>
          </div>
        </>
      )}

      {ToastUI}
    </div>
  );
}
