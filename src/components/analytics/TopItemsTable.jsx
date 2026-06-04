"use client";

import { useState } from "react";

export default function TopItemsTable({ items = [] }) {
  const [tab, setTab] = useState("Revenue");

  if (items.length === 0) {
    return (
      <div className="admin-surface-card p-5">
        <h3 className="admin-surface-title text-sm font-semibold">Top Performing Items</h3>
        <p className="mt-6 text-center text-sm admin-surface-faint">No order data yet.</p>
      </div>
    );
  }

  const sorted = tab === "Revenue"
    ? [...items].sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
    : [...items].sort((a, b) => (b.qty ?? b.quantity ?? 0) - (a.qty ?? a.quantity ?? 0));

  const maxVal = tab === "Revenue"
    ? (sorted[0]?.revenue ?? 1)
    : (sorted[0]?.qty ?? sorted[0]?.quantity ?? 1);

  return (
    <div className="admin-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="admin-surface-title text-sm font-semibold">Top Performing Items</h3>
          <p className="text-xs admin-surface-muted">Best dishes this period</p>
        </div>
        <div className="flex rounded-xl border admin-shell-border bg-zinc-950/60 p-0.5">
          {["Revenue", "Quantity"].map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                tab === t ? "bg-ra-primary text-zinc-950" : "admin-surface-muted hover:admin-surface-body"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {sorted.map((item, i) => {
          const val = tab === "Revenue" ? (item.revenue ?? 0) : (item.qty ?? item.quantity ?? 0);
          const pct = Math.round((val / maxVal) * 100);
          return (
            <div key={item.name ?? i} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-4 shrink-0 text-xs font-bold tabular-nums admin-surface-muted">{i + 1}</span>
                  <span className="truncate text-sm font-medium admin-shell-text">{item.name}</span>
                </div>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ra-primary">
                  {tab === "Revenue" ? `$${Number(item.revenue ?? 0).toFixed(0)}` : `${val} sold`}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-ra-accent to-ra-primary transition-all duration-500"
                  style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
