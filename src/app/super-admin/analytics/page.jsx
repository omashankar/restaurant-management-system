"use client";

import { raPageRefreshBtnCls } from "@/config/restaurantAdminTheme";
import SuperAdminPageSkeleton from "@/components/super-admin/SuperAdminPageSkeleton";
import { saIconBadgeCls, saSpinnerCls } from "@/config/superAdminTheme";
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
  paid:    "bg-sa-accent",
  pending: "bg-amber-500",
  failed:  "bg-red-500",
  refunded:"bg-zinc-500",
};

/* ─────────────────────────────────────────
   STAT CARD
───────────────────────────────────────── */
function StatCard({ label, value, sub, icon: Icon, color, bg, border }) {
  return (
    <div className={`min-w-0 rounded-2xl border p-4 sm:p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
          <p className={`mt-2 break-words text-2xl font-bold tabular-nums sm:text-3xl ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs admin-surface-faint">{sub}</p>}
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
function BarChart({ data, valueKey = "value", labelKey = "label", color = "bg-sa-primary", height = 160, prefix = "" }) {
  const max = Math.max(...data.map((d) => d[valueKey] ?? 0), 1);
  return (
    <div className="w-full min-w-0 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
      <div className="flex min-w-[22rem] items-end gap-0.5 sm:min-w-0 sm:gap-1" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(2, ((d[valueKey] ?? 0) / max) * 100);
        return (
          <div key={i} className="group relative flex min-w-[1.75rem] flex-1 flex-col items-center gap-1 sm:min-w-0">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg admin-chart-tooltip px-2 py-1 text-[10px] font-semibold admin-shell-text shadow-lg group-hover:flex">
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--admin-chart-ring)" strokeWidth={18} />
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
  const [loadError, setLoadError] = useState("");
  const { showToast, ToastUI } = useToast();
  const formatMoney = (value) => `₹${Number(value ?? 0).toLocaleString("en-IN")}`;

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res  = await fetch("/api/super-admin/analytics");
      const json = await res.json();
      if (res.ok && json.success) setData(json);
      else {
        const msg = json.error ?? "Failed to load analytics.";
        setLoadError(msg);
        showToast(msg, "error");
      }
    } catch {
      const msg = "Network error.";
      setLoadError(msg);
      showToast(msg, "error");
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
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-10">

      {/* ── Header ── */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 flex shrink-0 items-center justify-center ${saIconBadgeCls}`}>
            <BarChart3 className="size-5" />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Analytics</h1>
            <p className="admin-page-desc mt-1 text-sm">Platform-wide performance and growth metrics.</p>
          </div>
        </div>
        <div className="admin-page-header-actions">
        <button
          type="button"
          onClick={fetchAnalytics}
          disabled={loading}
          aria-label="Refresh analytics"
          className={raPageRefreshBtnCls}
        >
          <RefreshCw className={`size-4 ${loading ? saSpinnerCls : ""}`} />
          Refresh
        </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      )}

      {/* ── Skeleton ── */}
      {loading && !data && (
        <div className="space-y-4">
          <SuperAdminPageSkeleton cards={4} cardClassName="h-28" rows={0} />
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-2xl border border-sa-primary-10 admin-surface-card" />
            <div className="h-56 animate-pulse rounded-2xl border border-sa-primary-10 admin-surface-card" />
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-48 animate-pulse rounded-2xl border border-sa-primary-10 admin-surface-card" />
            <div className="h-48 animate-pulse rounded-2xl border border-sa-primary-10 admin-surface-card" />
            <div className="h-48 animate-pulse rounded-2xl border border-sa-primary-10 admin-surface-card" />
          </div>
        </div>
      )}

      {data && (
        <>
          {/* ── Overview stat cards ── */}
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Restaurants" value={ov.totalRestaurants ?? 0}
              sub={`${ov.activeRestaurants ?? 0} active`}
              icon={Building2} color="text-sa-primary" bg="bg-sa-primary-5" border="border-sa-primary-20"
            />
            <StatCard
              label="Total Revenue" value={formatMoney(ov.totalRevenue)}
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
          <div className="grid min-w-0 gap-4 lg:grid-cols-2">

            {/* Revenue by month */}
            <div className="min-w-0 admin-surface-card p-4 sm:p-5">
              <div className="mb-5 flex min-w-0 items-start gap-2 sm:items-center">
                <TrendingUp className="size-4 shrink-0 text-sa-primary" />
                <h2 className="min-w-0 break-words text-sm font-semibold admin-shell-text">Revenue — Last 12 Months</h2>
              </div>
              {(data.revenueByMonth ?? []).length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm admin-surface-faint">No revenue data yet.</p>
                </div>
              ) : (
                <BarChart
                  data={data.revenueByMonth}
                  valueKey="value"
                  labelKey="label"
                  color="bg-sa-primary"
                  height={160}
                  prefix="₹"
                />
              )}
            </div>

            {/* Restaurant growth */}
            <div className="min-w-0 admin-surface-card p-4 sm:p-5">
              <div className="mb-5 flex min-w-0 items-start gap-2 sm:items-center">
                <Activity className="size-4 shrink-0 text-indigo-400" />
                <h2 className="min-w-0 break-words text-sm font-semibold admin-shell-text">Restaurant Growth — Last 12 Months</h2>
              </div>
              {(data.restaurantGrowth ?? []).length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-sm admin-surface-faint">No data yet.</p>
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
          <div className="grid min-w-0 gap-4 lg:grid-cols-3">

            {/* Plan distribution */}
            <div className="min-w-0 admin-surface-card p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-semibold admin-shell-text">Plan Distribution</h2>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
                <DonutChart segments={planSegments} size={100} />
                <div className="w-full min-w-0 flex-1 space-y-2">
                  {(data.planBreakdown ?? []).map((p, planIdx) => {
                    const total = (data.planBreakdown ?? []).reduce((s, x) => s + x.count, 0) || 1;
                    const pct   = Math.round((p.count / total) * 100);
                    const c     = PLAN_COLOR[p.plan] ?? PLAN_COLOR.free;
                    return (
                      <div key={`plan-dist-${p.plan}-${planIdx}`}>
                        <div className="mb-1 flex min-w-0 flex-wrap items-center justify-between gap-1">
                          <span className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ${c.badge}`}>
                            {p.plan}
                          </span>
                          <span className="text-[10px] admin-surface-faint">{p.count} · {pct}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full admin-progress-track">
                          <div className={`h-1 rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {(data.planBreakdown ?? []).length === 0 && (
                    <p className="text-xs admin-surface-faint">No data yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment status */}
            <div className="min-w-0 admin-surface-card p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-semibold admin-shell-text">Payment Status</h2>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
                <DonutChart segments={statusSegments} size={100} />
                <div className="w-full min-w-0 flex-1 space-y-2.5">
                  {(data.paymentStatus ?? []).map((p) => {
                    const total = (data.paymentStatus ?? []).reduce((s, x) => s + x.count, 0) || 1;
                    const pct   = Math.round((p.count / total) * 100);
                    return (
                      <div key={p.status} className="flex min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className={`size-2 shrink-0 rounded-full ${STATUS_COLOR[p.status] ?? "bg-zinc-500"}`} />
                          <span className="truncate text-xs capitalize text-zinc-400">{p.status}</span>
                        </div>
                        <span className="shrink-0 text-xs font-semibold tabular-nums admin-surface-body">
                          {p.count} <span className="font-normal text-zinc-600">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                  {(data.paymentStatus ?? []).length === 0 && (
                    <p className="text-xs admin-surface-faint">No payments yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Top restaurants */}
            <div className="min-w-0 admin-surface-card p-4 sm:p-5">
              <h2 className="mb-4 text-sm font-semibold admin-shell-text">Top Restaurants by Revenue</h2>
              {(data.topRestaurants ?? []).length === 0 ? (
                <p className="text-xs admin-surface-faint">No revenue data yet.</p>
              ) : (
                <ol className="space-y-3">
                  {data.topRestaurants.map((r, i) => (
                    <li key={r.id} className="flex items-center gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full admin-rank-badge text-[10px] font-bold text-zinc-400">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-xs font-medium admin-shell-text">{r.restaurantName}</p>
                        <p className="text-[10px] admin-surface-faint">{r.txCount} transaction{r.txCount !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold tabular-nums text-sa-accent">
                        {formatMoney(r.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* ── Quick summary row ── */}
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="min-w-0 admin-surface-card px-4 py-4 sm:px-5">
              <p className="break-words text-xs font-semibold uppercase tracking-wider text-zinc-500">Avg Revenue / Restaurant</p>
              <p className="mt-2 break-words text-xl font-bold tabular-nums admin-shell-text sm:text-2xl">
                {formatMoney(
                  ov.totalRestaurants
                    ? Math.round((ov.totalRevenue ?? 0) / ov.totalRestaurants)
                    : 0
                )}
              </p>
            </div>
            <div className="min-w-0 admin-surface-card px-4 py-4 sm:px-5">
              <p className="break-words text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Rate</p>
              <p className="mt-2 text-xl font-bold tabular-nums admin-shell-text sm:text-2xl">
                {ov.totalRestaurants
                  ? Math.round(((ov.activeRestaurants ?? 0) / ov.totalRestaurants) * 100)
                  : 0}%
              </p>
              <p className="mt-1 text-xs admin-surface-faint">of restaurants are active</p>
            </div>
            <div className="min-w-0 admin-surface-card px-4 py-4 sm:px-5">
              <p className="break-words text-xs font-semibold uppercase tracking-wider text-zinc-500">Inactive Restaurants</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-red-400 sm:text-2xl">
                {ov.inactiveRestaurants ?? 0}
              </p>
              <p className="mt-1 text-xs admin-surface-faint">need attention</p>
            </div>
          </div>
        </>
      )}

      {ToastUI}
    </div>
  );
}
