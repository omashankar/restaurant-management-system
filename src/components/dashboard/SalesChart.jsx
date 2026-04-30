"use client";

import { useMemo, useState } from "react";

const FILTERS = ["Today", "Weekly", "Monthly", "Yearly"];

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

export default function SalesChart({ data = {} }) {
  const [activeFilter, setActiveFilter] = useState("Weekly");
  const [activeTab, setActiveTab]       = useState("sales");

  const chartData = useMemo(() => data[activeFilter] ?? [], [data, activeFilter]);
  const max = useMemo(
    () => Math.max(...chartData.map((d) => (activeTab === "sales" ? d.sales : d.orders)), 1),
    [chartData, activeTab]
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Sales Analytics</h3>
          <p className="text-xs text-zinc-500">Revenue and order volume over time</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-0.5">
            {["sales", "orders"].map((t) => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                  activeTab === t ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-0.5">
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setActiveFilter(f)}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  activeFilter === f ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-800">
          <p className="text-sm text-zinc-600">No data for this period yet.</p>
        </div>
      ) : (
        <div className="mt-6 flex h-48 items-end gap-1.5 sm:gap-2">
          {chartData.map((d) => {
            const val = activeTab === "sales" ? d.sales : d.orders;
            const h   = Math.round((val / max) * 100);
            return (
              <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="hidden text-[10px] text-zinc-500 opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                  {activeTab === "sales" ? fmt(val) : val}
                </span>
                <div className="flex h-40 w-full items-end justify-center">
                  <div className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                    activeTab === "sales"
                      ? "bg-gradient-to-t from-emerald-600/80 to-emerald-400/90 hover:from-emerald-500 hover:to-emerald-300"
                      : "bg-gradient-to-t from-indigo-600/80 to-indigo-400/90 hover:from-indigo-500 hover:to-indigo-300"
                  }`} style={{ height: `${Math.max(h, 6)}%` }}
                    title={`${d.label}: ${activeTab === "sales" ? fmt(val) : val + " orders"}`} />
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{d.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
