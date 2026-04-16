"use client";

import {
  Bar, BarChart, CartesianGrid, Cell, Legend,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  BarChart3, DollarSign, RefreshCw,
  ShoppingBag, TrendingUp, Trophy,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/* ── KPI card ── */
function KpiCard({ title, value, subtitle, icon: Icon, color = "emerald" }) {
  const colors = {
    emerald: { bg: "bg-emerald-500/10", ring: "ring-emerald-500/20", icon: "text-emerald-400", val: "text-emerald-400" },
    indigo:  { bg: "bg-indigo-500/10",  ring: "ring-indigo-500/20",  icon: "text-indigo-400",  val: "text-indigo-400"  },
    amber:   { bg: "bg-amber-500/10",   ring: "ring-amber-500/20",   icon: "text-amber-400",   val: "text-amber-400"   },
    sky:     { bg: "bg-sky-500/10",     ring: "ring-sky-500/20",     icon: "text-sky-400",     val: "text-sky-400"     },
  };
  const c = colors[color] ?? colors.emerald;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{title}</p>
          <p className={`mt-2 text-2xl font-bold ${c.val}`}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-zinc-600">{subtitle}</p>}
        </div>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${c.bg} ${c.ring}`}>
          <Icon className={`size-5 ${c.icon}`} />
        </span>
      </div>
    </div>
  );
}

/* ── Chart wrapper ── */
function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm ${className}`}>
      <p className="mb-4 text-sm font-semibold text-zinc-100">{title}</p>
      {children}
    </div>
  );
}

/* ── Custom tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 shadow-xl text-xs">
      <p className="mb-1 font-semibold text-zinc-300">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("revenue")
            ? `$${p.value.toFixed(2)}`
            : p.value}
        </p>
      ))}
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
  const [range, setRange]   = useState("30");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/analytics?range=${range}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, [range]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  /* ── Skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
          ))}
        </div>
      </div>
    );
  }

  const kpis        = data?.kpis        ?? {};
  const topItems    = data?.topItems    ?? [];
  const dailyRev    = data?.dailyRevenue ?? [];
  const orderTypes  = data?.ordersByType ?? [];

  /* Format daily data for chart */
  const chartData = dailyRev.map((d) => ({
    ...d,
    label: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Analytics</h1>
            <p className="mt-1 text-sm text-zinc-500">Revenue, orders, and performance insights.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex rounded-xl border border-zinc-800 p-0.5">
            {RANGES.map((r) => (
              <button key={r.value} type="button" onClick={() => setRange(r.value)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  range === r.value ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={fetchAnalytics}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Total Revenue"   value={`$${kpis.totalRevenue?.toLocaleString() ?? 0}`}  subtitle={`Last ${range} days`} icon={DollarSign}  color="emerald" />
        <KpiCard title="Total Orders"    value={kpis.totalOrders?.toLocaleString() ?? 0}          subtitle={`Last ${range} days`} icon={ShoppingBag} color="indigo"  />
        <KpiCard title="Avg Order Value" value={`$${kpis.avgOrderValue?.toFixed(2) ?? "0.00"}`}   subtitle="Per transaction"      icon={TrendingUp}  color="amber"   />
        <KpiCard title="Completed"       value={kpis.completedOrders?.toLocaleString() ?? 0}      subtitle={`${kpis.cancelledOrders ?? 0} cancelled`} icon={Trophy} color="sky" />
      </div>

      {/* Charts row 1 — Revenue + Orders */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Daily Revenue Line Chart */}
        <ChartCard title="Daily Revenue">
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">No data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#10b981" }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Daily Orders Bar Chart */}
        <ChartCard title="Daily Orders">
          {chartData.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">No data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="label" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 — Top items + Order types */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Top Selling Items */}
        <ChartCard title="Top Selling Items">
          {topItems.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">No orders yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, topItems.length * 36)}>
              <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#71717a", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="Qty sold" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Order Types Pie */}
        <ChartCard title="Orders by Type">
          {orderTypes.every((t) => t.value === 0) ? (
            <div className="flex h-48 items-center justify-center text-sm text-zinc-600">No orders yet.</div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={orderTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    paddingAngle={3} dataKey="value" nameKey="name">
                    {orderTypes.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4">
                {orderTypes.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full" style={{ background: t.color }} />
                    <span className="text-zinc-400">{t.name}</span>
                    <span className="font-bold text-zinc-200">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Top items revenue table */}
      {topItems.length > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
            <Trophy className="size-4 text-amber-400" />
            <p className="text-sm font-semibold text-zinc-100">Top Items by Revenue</p>
          </div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Item</th>
                <th className="px-5 py-3 text-right">Qty Sold</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {topItems.map((item, i) => (
                <tr key={item.name} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-zinc-600 font-mono text-xs">{i + 1}</td>
                  <td className="px-5 py-3 font-medium text-zinc-100">{item.name}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-zinc-300">{item.qty}</td>
                  <td className="px-5 py-3 text-right tabular-nums font-semibold text-emerald-400">
                    ${item.revenue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
