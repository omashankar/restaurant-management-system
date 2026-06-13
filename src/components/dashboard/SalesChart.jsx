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

  const barMinWidth = chartData.length > 8 ? "2.75rem" : "2.25rem";

  return (
    <div className={`rms-dashboard-card rms-dashboard-card--lg flex h-full min-h-0 w-full min-w-0 flex-col p-4 sm:p-5 ${adminSurface.card}`}>
      <div className="flex shrink-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className={`break-words text-sm font-semibold ${adminSurface.title}`}>Sales Analytics</h3>
          <p className={`break-words text-xs ${adminSurface.muted}`}>Revenue and order volume over time</p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
          <div className={`inline-flex max-w-full shrink-0 gap-0.5 overflow-x-auto scroll-px-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] sm:overflow-visible [&::-webkit-scrollbar]:hidden ${adminSurface.segmentTrack}`}>
            {["sales", "orders"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`shrink-0 capitalize ${adminSurface.segmentBtn} ${
                  activeTab === t ? "bg-ra-primary text-zinc-950" : ""
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className={`inline-flex max-w-full shrink-0 gap-0.5 overflow-x-auto scroll-px-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] sm:overflow-visible [&::-webkit-scrollbar]:hidden ${adminSurface.segmentTrack}`}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 ${adminSurface.segmentBtn} ${
                  activeFilter === f ? adminSurface.segmentBtnActive : ""
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-3 min-h-0 flex-1 pr-1 sm:mt-4">
      {chartData.length === 0 ? (
        <div className={`min-h-[10rem] sm:min-h-[12rem] ${adminSurface.dashedBox}`}>
          <p className={`text-sm ${adminSurface.faint}`}>No data for this period yet.</p>
        </div>
      ) : (
        <div
          className="flex min-h-[10rem] items-end gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:min-h-[12rem] sm:gap-2 lg:overflow-visible lg:pb-0"
          style={{ scrollSnapType: "x proximity" }}
        >
          {chartData.map((d, index) => {
            const val = activeTab === "sales" ? d.sales : d.orders;
            const h   = Math.round((val / max) * 100);
            const displayVal = activeTab === "sales" ? fmt(val) : val;
            return (
              <div
                key={d.key ?? `${d.label}-${index}`}
                className="group flex flex-col items-center gap-1 sm:gap-1.5"
                style={{ minWidth: barMinWidth, flex: chartData.length <= 8 ? "1 1 0" : "0 0 auto", scrollSnapAlign: "start" }}
              >
                <span className="text-[10px] font-medium tabular-nums admin-surface-faint sm:hidden">
                  {displayVal}
                </span>
                <span className="hidden text-[10px] admin-surface-faint opacity-0 transition-opacity group-hover:opacity-100 sm:block">
                  {displayVal}
                </span>
                <div className="flex h-28 w-full items-end justify-center sm:h-36 lg:h-40">
                  <div
                    className={`w-full max-w-8 rounded-t-md transition-all duration-500 sm:max-w-10 sm:rounded-t-lg ${
                      activeTab === "sales"
                        ? "bg-gradient-to-t from-ra-primary to-ra-accent hover:opacity-90"
                        : "bg-gradient-to-t from-indigo-600/80 to-indigo-400/90 hover:from-indigo-500 hover:to-indigo-300"
                    }`}
                    style={{ height: `${Math.max(h, 6)}%` }}
                    title={`${d.label}: ${activeTab === "sales" ? fmt(val) : val + " orders"}`}
                  />
                </div>
                <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
}
