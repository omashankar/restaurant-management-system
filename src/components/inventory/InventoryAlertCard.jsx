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
      className={`cursor-pointer w-full rounded-2xl border p-4 text-left transition-all duration-200 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
        stressed
          ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/55"
          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            stressed
              ? "bg-amber-500/15 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
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
            <p className="font-medium text-zinc-100">{item.name}</p>
            <InventoryStatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{item.category}</p>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-semibold text-zinc-50 tabular-nums">
                {item.quantity}
              </p>
              <p className="text-xs text-zinc-500">{item.unit} on hand</p>
            </div>
            <p className="text-xs text-zinc-500">
              Reorder at{" "}
              <span className="text-zinc-300">{item.reorderLevel}</span>
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}
