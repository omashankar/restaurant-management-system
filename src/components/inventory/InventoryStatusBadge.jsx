"use client";

import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";

const STYLES = {
  in: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  low: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  out: "border-red-500/35 bg-red-500/10 text-red-300",
};

const LABELS = { in: "In stock", low: "Low stock", out: "Out of stock" };

export default function InventoryStatusBadge({ item, status: statusProp }) {
  const status = statusProp ?? computeInventoryStatus(item);
  return (
    <span
      className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
