"use client";

import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";
import InventoryStatusBadge from "@/components/inventory/InventoryStatusBadge";
import DataTableShell from "@/components/ui/DataTableShell";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";

export default function InventoryTable({ rows, onEdit, onDelete, onUpdateQty, footer }) {
  return (
    <DataTableShell>
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3">Name</th>
            <th className="hidden px-4 py-3 md:table-cell">Category</th>
            <th className="px-4 py-3 text-right tabular-nums">Stock</th>
            <th className="px-4 py-3 text-right tabular-nums">Reorder</th>
            <th className="hidden px-4 py-3 lg:table-cell">Unit</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = computeInventoryStatus(row);
            const rowAccent =
              status === "out"
                ? "bg-red-500/[0.06]"
                : status === "low"
                  ? "bg-amber-500/[0.06]"
                  : "hover:bg-zinc-800/40";
            return (
              <tr
                key={row.id}
                className={`border-b border-zinc-800/80 transition-colors duration-150 ${rowAccent}`}
              >
                <td className="px-4 py-3 font-medium text-zinc-100">
                  {row.name}
                </td>
                <td className="hidden px-4 py-3 text-zinc-400 md:table-cell">
                  {row.category}
                </td>

                {/* Quantity with inline +/- */}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty?.(row, -1)}
                      className="cursor-pointer flex size-6 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Decrease ${row.name}`}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-8 text-center tabular-nums font-semibold text-zinc-200">
                      {row.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty?.(row, +1)}
                      className="cursor-pointer flex size-6 items-center justify-center rounded-md border border-zinc-700 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
                      aria-label={`Increase ${row.name}`}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </td>

                <td className="px-4 py-3 text-right tabular-nums text-zinc-400">
                  {row.reorderLevel}
                </td>
                <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                  {row.unit}
                </td>
                <td className="px-4 py-3">
                  <InventoryStatusBadge item={row} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                      aria-label={`Edit ${row.name}`}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="cursor-pointer rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-500/15 hover:text-red-300"
                      aria-label={`Delete ${row.name}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {footer}
    </DataTableShell>
  );
}
