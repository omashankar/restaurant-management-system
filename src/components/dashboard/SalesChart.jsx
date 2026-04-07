"use client";

import { useMemo, useState } from "react";

const FILTERS = ["Today", "Weekly", "Monthly", "Yearly"];

// Scaled mock data per filter
const filterData = {
  Today: [
    { label: "10AM", sales: 420, orders: 12 },
    { label: "12PM", sales: 1840, orders: 38 },
    { label: "2PM", sales: 1120, orders: 24 },
    { label: "4PM", sales: 680, orders: 15 },
    { label: "6PM", sales: 2100, orders: 44 },
    { label: "8PM", sales: 3200, orders: 62 },
    { label: "10PM", sales: 2480, orders: 51 },
  ],
  Weekly: [
    { label: "Mon", sales: 4200, orders: 58 },
    { label: "Tue", sales: 5100, orders: 71 },
    { label: "Wed", sales: 4800, orders: 65 },
    { label: "Thu", sales: 6200, orders: 84 },
    { label: "Fri", sales: 8900, orders: 118 },
    { label: "Sat", sales: 11200, orders: 148 },
    { label: "Sun", sales: 9800, orders: 130 },
  ],
  Monthly: [
    { label: "Nov", sales: 68400, orders: 920 },
    { label: "Dec", sales: 91200, orders: 1240 },
    { label: "Jan", sales: 74500, orders: 1010 },
    { label: "Feb", sales: 82300, orders: 1120 },
    { label: "Mar", sales: 95600, orders: 1290 },
    { label: "Apr", sales: 103200, orders: 1380 },
  ],
  Yearly: [
    { label: "2021", sales: 620000, orders: 8400 },
    { label: "2022", sales: 740000, orders: 9800 },
    { label: "2023", sales: 810000, orders: 10900 },
    { label: "2024", sales: 920000, orders: 12400 },
    { label: "2025", sales: 1040000, orders: 14100 },
    { label: "2026", sales: 380000, orders: 5200 },
  ],
};

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

export default function SalesChart() {
  const [activeFilter, setActiveFilter] = useState("Weekly");
  const [activeTab, setActiveTab] = useState("sales");
  const data = filterData[activeFilter];

  const max = useMemo(
    () => Math.max(...data.map((d) => (activeTab === "sales" ? d.sales : d.orders)), 1),
    [data, activeTab]
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Sales Analytics</h3>
          <p className="text-xs text-zinc-500">Revenue and order volume over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Sales / Orders tab */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-0.5">
            {["sales", "orders"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  activeTab === t
                    ? "bg-emerald-500 text-zinc-950"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          {/* Period filter */}
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeFilter === f
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div className="mt-6 flex h-48 items-end gap-1.5 sm:gap-2">
        {data.map((d) => {
          const val = activeTab === "sales" ? d.sales : d.orders;
          const h = Math.round((val / max) * 100);
          return (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
              <span className="hidden text-[10px] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                {activeTab === "sales" ? fmt(val) : val}
              </span>
              <div className="flex h-40 w-full items-end justify-center">
                <div
                  className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                    activeTab === "sales"
                      ? "bg-gradient-to-t from-emerald-600/80 to-emerald-400/90 hover:from-emerald-500 hover:to-emerald-300"
                      : "bg-gradient-to-t from-indigo-600/80 to-indigo-400/90 hover:from-indigo-500 hover:to-indigo-300"
                  }`}
                  style={{ height: `${Math.max(h, 6)}%` }}
                  title={`${d.label}: ${activeTab === "sales" ? fmt(val) : val + " orders"}`}
                />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
