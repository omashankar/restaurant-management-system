"use client";

import { useState } from "react";
import { topDishesByRevenue } from "@/lib/mockData";

const TABS = ["Revenue", "Quantity"];

export default function TopItemsTable() {
  const [tab, setTab] = useState("Revenue");

  const sorted =
    tab === "Revenue"
      ? [...topDishesByRevenue].sort((a, b) => b.revenue - a.revenue)
      : [...topDishesByRevenue].sort((a, b) => b.qty - a.qty);

  const maxVal = tab === "Revenue" ? sorted[0].revenue : sorted[0].qty;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Top Performing Items</h3>
          <p className="text-xs text-zinc-500">Best dishes this month</p>
        </div>
        <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-0.5">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === t ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sorted.map((item, i) => {
          const val = tab === "Revenue" ? item.revenue : item.qty;
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-200">{item.name}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-400">
                  {tab === "Revenue" ? `$${item.revenue.toFixed(0)}` : `${item.qty} sold`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
