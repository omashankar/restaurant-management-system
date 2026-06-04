"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { adminChartTick, adminChartTooltipStyle } from "@/lib/adminChartTheme";
import { useAdminChartTheme } from "@/hooks/useAdminChartTheme";
import { useRestaurantTheme } from "@/hooks/useRestaurantTheme";
import {
  Bar, BarChart, CartesianGrid, Cell,
  Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`${adminSurface.card} p-5 shadow-sm ${className}`}>
      <p className={`mb-4 text-sm font-semibold ${adminSurface.title}`}>{title}</p>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency = "INR" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={adminSurface.tooltip}>
      <p className={`mb-1 font-semibold ${adminSurface.body}`}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && String(p.name).toLowerCase().includes("revenue")
            ? formatAdminMoney(p.value, currency)
            : p.value}
        </p>
      ))}
    </div>
  );
}

/**
 * Lazy-loaded chart bundle (recharts) for tenant analytics page.
 */
export default function TenantAnalyticsCharts({ chartData, topItems, orderTypes, currency = "INR" }) {
  const { theme } = useRestaurantTheme();
  const chart = useAdminChartTheme();
  const primary = theme.primaryColor;
  const fmtAxis = (v) => formatAdminMoney(v, currency, { decimals: 0 });
  const tick = adminChartTick(11);
  const tickCat = adminChartTick(11, true);
  const tooltipStyle = adminChartTooltipStyle();

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Daily Revenue">
          {chartData.length === 0 ? (
            <div className={`flex h-48 items-center justify-center text-sm ${adminSurface.faint}`}>
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
                <YAxis tick={tick} tickLine={false} axisLine={false} tickFormatter={fmtAxis} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke={primary} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: primary }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Daily Orders">
          {chartData.length === 0 ? (
            <div className={`flex h-48 items-center justify-center text-sm ${adminSurface.faint}`}>
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} />
                <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
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
            <div className={`flex h-48 items-center justify-center text-sm ${adminSurface.faint}`}>
              No orders yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(220, topItems.length * 36)}>
              <BarChart data={topItems} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis type="number" tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={tickCat} tickLine={false} axisLine={false} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="qty" name="Qty sold" fill={primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Orders by Type">
          {orderTypes.every((t) => t.value === 0) ? (
            <div className={`flex h-48 items-center justify-center text-sm ${adminSurface.faint}`}>
              No orders yet.
            </div>
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
                  <Tooltip formatter={(v, n) => [v, n]} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4">
                {orderTypes.map((t) => (
                  <div key={t.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full" style={{ background: t.color }} />
                    <span className={adminSurface.muted}>{t.name}</span>
                    <span className={`font-bold ${adminSurface.body}`}>{t.value}</span>
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
