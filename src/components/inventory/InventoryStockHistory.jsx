"use client";

import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";
import { TrendingDown, TrendingUp } from "lucide-react";

function formatShortDate(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function InventoryStockHistory({ historyEntries, items }) {
  const maxQty = Math.max(1, ...items.map((i) => Number(i.quantity) || 0));
  const sortedItems = [...items].sort(
    (a, b) => (Number(b.quantity) || 0) - (Number(a.quantity) || 0)
  );
  const chartRows = sortedItems.slice(0, 8);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">
          Recent adjustments
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Latest stock movements (newest first)
        </p>
        <ul className="mt-4 max-h-[280px] space-y-3 overflow-y-auto pr-1">
          {historyEntries.length === 0 ? (
            <li className="text-sm text-zinc-500">No history yet.</li>
          ) : (
            historyEntries.map((entry) => {
              const up = entry.delta > 0;
              return (
                <li
                  key={entry.id}
                  className="flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-zinc-700"
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      up
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="size-4" aria-hidden />
                    ) : (
                      <TrendingDown className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-100">
                      {entry.itemName}
                    </p>
                    <p className="text-xs text-zinc-500">{entry.message}</p>
                    <p className="mt-1 text-xs tabular-nums text-zinc-400">
                      {up ? "+" : ""}
                      {entry.delta} · {formatShortDate(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Stock levels</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Relative on-hand quantity (top items)
        </p>
        <div className="mt-4 space-y-3">
          {chartRows.length === 0 ? (
            <p className="text-sm text-zinc-500">No items to chart.</p>
          ) : (
            chartRows.map((item) => {
              const pct = Math.round(
                ((Number(item.quantity) || 0) / maxQty) * 100
              );
              const status = computeInventoryStatus(item);
              const barColor =
                status === "out"
                  ? "from-red-500/80 to-red-600/60"
                  : status === "low"
                    ? "from-amber-500/80 to-amber-600/50"
                    : "from-emerald-500/70 to-emerald-600/50";
              return (
                <div key={item.id}>
                  <div className="mb-1 flex justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-zinc-200">
                      {item.name}
                    </span>
                    <span className="shrink-0 tabular-nums text-zinc-500">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-500 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
