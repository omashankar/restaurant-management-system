"use client";

import {
  computeInventoryStatus,
  computeReorderMarkerPct,
  computeStockLevelPct,
  inventoryStockBarCls,
  inventoryStockTrackCls,
} from "@/components/inventory/inventoryUtils";

export default function InventoryStockLevelBar({
  item,
  showLabel = false,
  showReorderMarker = false,
  className = "",
}) {
  const status = computeInventoryStatus(item);
  const pct = computeStockLevelPct(item);
  const reorderPct = showReorderMarker ? computeReorderMarkerPct(item) : null;

  return (
    <div className={className}>
      {showLabel ? (
        <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wide admin-surface-faint">
          <span>Stock level</span>
          <span className="tabular-nums">{pct}%</span>
        </div>
      ) : null}
      <div className="relative">
        <div
          className={`h-2 overflow-hidden rounded-full ${inventoryStockTrackCls(status)}`}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Stock level ${pct}%`}
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r ${inventoryStockBarCls(status)} transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(pct, pct > 0 && pct < 4 ? 4 : 0)}%` }}
          />
        </div>
        {reorderPct != null ? (
          <span
            className="pointer-events-none absolute top-0 bottom-0 w-px -translate-x-1/2 bg-zinc-500/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{ left: `${reorderPct}%` }}
            title={`Reorder at ${item.reorderLevel}`}
            aria-hidden
          />
        ) : null}
      </div>
      {showReorderMarker && Number(item.reorderLevel) > 0 ? (
        <p className="mt-1 text-[10px] admin-surface-faint">
          Reorder at{" "}
          <span className="font-medium tabular-nums admin-surface-muted">
            {item.reorderLevel}
          </span>
        </p>
      ) : null}
    </div>
  );
}
