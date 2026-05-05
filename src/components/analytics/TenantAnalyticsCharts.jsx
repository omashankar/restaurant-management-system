"use client";

import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-sm ${className}`}>
      <p className="mb-4 text-sm font-semibold text-zinc-100">{title}</p>
      {children}
    </div>
  );
}

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

/**
 * Lazy-loaded chart bundle (recharts) for tenant analytics page.
 */
export default function TenantAnalyticsCharts({ chartData, topItems, orderTypes }) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
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

      <div className="grid gap-6 lg:grid-cols-2">
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
    </>
  );
}
