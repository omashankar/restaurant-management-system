"use client";

import InventoryStatusBadge from "@/components/inventory/InventoryStatusBadge";
import InventoryStockLevelBar from "@/components/inventory/InventoryStockLevelBar";
import {
  computeInventoryStatus,
  inventoryQtyTextCls,
  sortItemsForStockLevels,
} from "@/components/inventory/inventoryUtils";
import PaginationBar from "@/components/ui/PaginationBar";
import { usePaginatedList } from "@/hooks/usePaginatedList";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useMemo } from "react";

export default function InventoryStockHistory({ historyEntries, items }) {
  const { formatShortDateTime } = useAdminLocale();
  const {
    page,
    setPage,
    pageRows,
    total,
    totalPages,
    pageSize,
  } = usePaginatedList(historyEntries, {
    searchKeys: ["itemName", "message"],
    pageSize: 8,
  });

  const chartRows = useMemo(() => sortItemsForStockLevels(items), [items]);

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="min-w-0 rounded-2xl border admin-shell-border bg-zinc-900/40 p-4 sm:p-5">
        <h3 className="break-words admin-surface-title text-sm font-semibold">
          Recent adjustments
        </h3>
        <p className="mt-0.5 break-words text-xs admin-surface-muted">
          Latest stock movements (newest first)
        </p>
        <ul className="mt-4 space-y-3 pr-1">
          {total === 0 ? (
            <li className="text-sm admin-surface-muted">No history yet.</li>
          ) : (
            pageRows.map((entry) => {
              const up = entry.delta > 0;
              return (
                <li
                  key={entry.id}
                  className="flex gap-3 rounded-xl border border-[var(--admin-border-subtle)] bg-zinc-950/50 px-3 py-2.5 transition-colors hover:border-zinc-700"
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      up
                        ? "bg-ra-primary-15 text-ra-primary"
                        : "bg-zinc-800 admin-surface-muted"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="size-4" aria-hidden />
                    ) : (
                      <TrendingDown className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium admin-shell-text">
                      {entry.itemName}
                    </p>
                    <p className="break-words text-xs admin-surface-muted">{entry.message}</p>
                    <p className="mt-1 text-xs tabular-nums admin-surface-muted">
                      {up ? "+" : ""}
                      {entry.delta} · {formatShortDateTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })
          )}
        </ul>
        {total > 0 && (
          <PaginationBar
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
            onPageChange={setPage}
            hideWhenSinglePage
            className="mt-3 border-t-0 pt-2"
          />
        )}
      </div>

      <div className="min-w-0 rounded-2xl border admin-shell-border bg-zinc-900/40 p-4 sm:p-5">
        <h3 className="break-words admin-surface-title text-sm font-semibold">Stock levels</h3>
        <p className="mt-0.5 break-words text-xs admin-surface-muted">
          On-hand vs par level — out &amp; low items first, bar color matches status
        </p>
        <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
          {chartRows.length === 0 ? (
            <p className="text-sm admin-surface-muted">No items to chart.</p>
          ) : (
            chartRows.map((item) => {
              const status = computeInventoryStatus(item);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--admin-border-subtle)] bg-zinc-950/40 px-3 py-3"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <span className="min-w-0 break-words font-medium admin-shell-text">
                        {item.name}
                      </span>
                      <InventoryStatusBadge status={status} />
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold tabular-nums ${inventoryQtyTextCls(status)}`}
                    >
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <InventoryStockLevelBar
                    item={item}
                    showLabel
                    showReorderMarker
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
