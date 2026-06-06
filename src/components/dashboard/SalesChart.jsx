"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
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
    <div className={`rms-dashboard-card rms-dashboard-card--lg flex h-full min-h-0 w-full flex-col p-5 ${adminSurface.card}`}>
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className={`text-sm font-semibold ${adminSurface.title}`}>Sales Analytics</h3>
          <p className={`text-xs ${adminSurface.muted}`}>Revenue and order volume over time</p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className={`flex w-full ${adminSurface.segmentTrack} sm:w-auto`}>
            {["sales", "orders"].map((t) => (
              <button key={t} type="button" onClick={() => setActiveTab(t)}
                className={`${adminSurface.segmentBtn} ${
                  activeTab === t ? "bg-ra-primary text-zinc-950" : ""
                }`}>
                {t}
              </button>
            ))}
          </div>
          <div className={`flex w-full ${adminSurface.segmentTrack} sm:w-auto`}>
            {FILTERS.map((f) => (
              <button key={f} type="button" onClick={() => setActiveFilter(f)}
                className={`${adminSurface.segmentBtn} ${
                  activeFilter === f ? adminSurface.segmentBtnActive : ""
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-4 min-h-0 flex-1 pr-1">
      {chartData.length === 0 ? (
        <div className={`min-h-[12rem] ${adminSurface.dashedBox}`}>
          <p className={`text-sm ${adminSurface.faint}`}>No data for this period yet.</p>
        </div>
      ) : (
        <div className="flex min-h-[12rem] items-end gap-1 overflow-x-auto pb-1 sm:gap-2 sm:overflow-visible sm:pb-0">
          {chartData.map((d, index) => {
            const val = activeTab === "sales" ? d.sales : d.orders;
            const h   = Math.round((val / max) * 100);
            return (
              <div key={d.key ?? `${d.label}-${index}`} className="group flex min-w-[2.25rem] flex-1 flex-col items-center gap-1.5 sm:min-w-0">
                <span className="hidden text-[10px] admin-surface-faint opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                  {activeTab === "sales" ? fmt(val) : val}
                </span>
                <div className="flex h-40 w-full items-end justify-center">
                  <div className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                    activeTab === "sales"
                      ? "bg-gradient-to-t from-ra-primary to-ra-accent hover:opacity-90"
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
    </div>
  );
}
