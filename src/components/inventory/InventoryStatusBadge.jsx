"use client";

import {
  computeInventoryStatus,
  INVENTORY_STATUS_LABELS,
  inventoryStatusBadgeCls,
} from "@/components/inventory/inventoryUtils";

export default function InventoryStatusBadge({ item, status: statusProp }) {
  const status = statusProp ?? computeInventoryStatus(item);
  return (
    <span
      className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold capitalize ${inventoryStatusBadgeCls(status)}`}
    >
      {INVENTORY_STATUS_LABELS[status] ?? status}
    </span>
  );
}
