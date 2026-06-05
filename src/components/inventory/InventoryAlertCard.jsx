"use client";

import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";
import InventoryStatusBadge from "@/components/inventory/InventoryStatusBadge";
import { AlertTriangle, Package } from "lucide-react";

export default function InventoryAlertCard({ item, onOpen }) {
  const status = computeInventoryStatus(item);
  const stressed = status !== "in";

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className={`cursor-pointer w-full rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ra-primary-40 ${
        stressed
          ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/55"
          : "admin-shell-border admin-surface-card hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            stressed
              ? "bg-amber-500/15 text-amber-400"
              : "bg-ra-primary-10 text-ra-primary"
          }`}
        >
          {stressed ? (
            <AlertTriangle className="size-5" aria-hidden />
          ) : (
            <Package className="size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium admin-shell-text">{item.name}</p>
            <InventoryStatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs admin-surface-muted">{item.category}</p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-semibold text-zinc-50 tabular-nums">
                {item.quantity}
              </p>
              <p className="text-xs admin-surface-muted">{item.unit} on hand</p>
            </div>
            <p className="text-xs admin-surface-muted">
              Reorder at{" "}
              <span className="admin-surface-body">{item.reorderLevel}</span>
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
