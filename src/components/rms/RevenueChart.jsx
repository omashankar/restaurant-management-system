"use client";

import { useMemo } from "react";

export default function RevenueChart({ data, className = "" }) {
  const max = useMemo(
    () => Math.max(...data.map((d) => d.amount), 1),
    [data]
  );
  return (
    <div
      className={`admin-surface-card p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="admin-surface-title text-sm font-semibold">Revenue</h3>
          <p className="text-xs admin-surface-muted">Last 7 days · mock data</p>
        </div>
      </div>
      <div className="mt-6 flex h-44 items-end gap-2">
        {data.map((d) => {
          const h = Math.round((d.amount / max) * 100);
          return (
            <div
              key={d.day}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div className="flex h-36 w-full items-end justify-center">
                <div
                  className="w-full max-w-10 rounded-t-lg bg-gradient-to-t from-ra-primary to-ra-accent transition-all duration-300 hover:opacity-90"
                  style={{ height: `${Math.max(h, 8)}%` }}
                  title={`${d.day}: $${d.amount}`}
                />
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wide admin-surface-muted">
                {d.day}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
