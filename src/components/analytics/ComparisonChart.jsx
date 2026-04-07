"use client";

import { useState } from "react";
import { dailyRevenue, monthlySales } from "@/lib/mockData";
import { TrendingUp } from "lucide-react";

const PERIODS = ["Daily", "Monthly"];

function fmt(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
}

export default function ComparisonChart() {
  const [period, setPeriod] = useState("Daily");
  const data =
    period === "Daily"
      ? dailyRevenue
      : monthlySales.map((m, i, arr) => ({
          label: m.month,
          current: m.sales,
          previous: arr[i - 1]?.sales ?? Math.round(m.sales * 0.91),
        }));

  const maxVal = Math.max(...data.flatMap((d) => [d.current, d.previous]), 1);
  const totalCurrent = data.reduce((s, d) => s + d.current, 0);
  const totalPrev = data.reduce((s, d) => s + d.previous, 0);
  const change = (((totalCurrent - totalPrev) / totalPrev) * 100).toFixed(1);
  const positive = Number(change) >= 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Revenue Comparison</h3>
          <p className="text-xs text-zinc-500">Current vs previous period</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 text-xs font-semibold ${
              positive
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/25 bg-red-500/10 text-red-400"
            }`}
          >
            <TrendingUp className="size-3" />
            {positive ? "+" : ""}{change}%
          </span>
          <div className="flex rounded-xl border border-zinc-800 bg-zinc-950/60 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  period === p ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
          <span className="size-2.5 rounded-full bg-emerald-400" /> Current
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="size-2.5 rounded-full bg-zinc-600" /> Previous
        </span>
      </div>

      {/* Grouped bars */}
      <div className="mt-4 flex h-44 items-end gap-1 sm:gap-2">
        {data.map((d) => {
          const hC = Math.round((d.current / maxVal) * 100);
          const hP = Math.round((d.previous / maxVal) * 100);
          return (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-36 w-full items-end justify-center gap-0.5">
                <div
                  className="w-full max-w-[18px] rounded-t-md bg-zinc-600 transition-all duration-500 hover:bg-zinc-500"
                  style={{ height: `${Math.max(hP, 4)}%` }}
                  title={`Prev: ${fmt(d.previous)}`}
                />
                <div
                  className="w-full max-w-[18px] rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 hover:from-emerald-500 hover:to-emerald-300"
                  style={{ height: `${Math.max(hC, 4)}%` }}
                  title={`Current: ${fmt(d.current)}`}
                />
              </div>
              <span className="text-[10px] font-medium text-zinc-500">{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
