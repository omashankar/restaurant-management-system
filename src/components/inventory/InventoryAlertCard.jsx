"use client";

import {
  computeInventoryStatus,
  inventoryCardCls,
  inventoryIconCls,
  inventoryQtyTextCls,
} from "@/components/inventory/inventoryUtils";
import InventoryStatusBadge from "@/components/inventory/InventoryStatusBadge";
import InventoryStockLevelBar from "@/components/inventory/InventoryStockLevelBar";
import { AlertTriangle, Package, PackageX } from "lucide-react";

export default function InventoryAlertCard({ item, onOpen }) {
  const status = computeInventoryStatus(item);

  const Icon =
    status === "out" ? PackageX : status === "low" ? AlertTriangle : Package;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(item)}
      className={`cursor-pointer w-full rounded-2xl border p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ra-primary-40 ${inventoryCardCls(status)}`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${inventoryIconCls(status)}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 break-words font-medium admin-shell-text">{item.name}</p>
            <InventoryStatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs admin-surface-muted">{item.category}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={`text-2xl font-bold tabular-nums ${inventoryQtyTextCls(status)}`}>
                {item.quantity}
              </p>
              <p className="text-xs admin-surface-muted">{item.unit} on hand</p>
            </div>
            <p className="text-xs admin-surface-muted sm:text-right">
              Reorder at{" "}
              <span className="font-medium admin-surface-body">{item.reorderLevel}</span>
            </p>
          </div>
          <InventoryStockLevelBar item={item} showLabel className="mt-3" />
        </div>
      </div>
    </button>
  );
}
