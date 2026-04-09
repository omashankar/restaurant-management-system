"use client";

import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";
import InventoryStatusBadge from "@/components/inventory/InventoryStatusBadge";
import DataTableShell from "@/components/ui/DataTableShell";
import { Minus, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

/** Per-row qty editor with input + refresh */
function QtyEditor({ row, onUpdateQty }) {
  const [val, setVal] = useState(String(row.quantity));
  const [dirty, setDirty] = useState(false);

  const handleChange = (e) => {
    setVal(e.target.value);
    setDirty(true);
  };

  const handleRefresh = () => {
    const next = Math.max(0, parseInt(val, 10) || 0);
    const delta = next - row.quantity;
    if (delta !== 0) onUpdateQty?.(row, delta);
    setDirty(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleRefresh();
    if (e.key === "Escape") { setVal(String(row.quantity)); setDirty(false); }
  };

  // Sync if row.quantity changes externally
  if (!dirty && val !== String(row.quantity)) {
    setVal(String(row.quantity));
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => { const n = Math.max(0, (parseInt(val,10)||0) - 1); setVal(String(n)); setDirty(true); onUpdateQty?.(row, -1); }}
        className="cursor-pointer flex size-7 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        aria-label="Decrease"
      >
        <Minus className="size-3.5" />
      </button>

      <input
        type="number"
        min={0}
        value={val}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-14 rounded-lg border border-zinc-700 bg-zinc-950/60 px-1.5 py-1 text-center text-sm tabular-nums text-zinc-100 outline-none focus:border-emerald-500/40"
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={() => { const n = (parseInt(val,10)||0) + 1; setVal(String(n)); setDirty(true); onUpdateQty?.(row, +1); }}
        className="cursor-pointer flex size-7 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={handleRefresh}
        className={`cursor-pointer flex size-7 items-center justify-center rounded-lg border transition-colors ${
          dirty
            ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
            : "border-zinc-700 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400"
        }`}
        aria-label="Apply quantity"
        title="Apply (Enter)"
      >
        <RefreshCw className="size-3.5" />
      </button>
    </div>
  );
}

export default function InventoryTable({ rows, onEdit, onDelete, onUpdateQty, footer }) {
  return (
    <DataTableShell>
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <th className="px-4 py-3">Name</th>
            <th className="hidden px-4 py-3 md:table-cell">Category</th>
            <th className="px-4 py-3 text-center">QTY</th>
            <th className="px-4 py-3 text-center tabular-nums">Reorder</th>
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

                {/* QTY — plain number */}
                <td className="px-4 py-3 text-center tabular-nums font-semibold text-zinc-200">
                  {row.quantity}
                </td>

                {/* Reorder */}
                <td className="px-4 py-3 text-center tabular-nums text-zinc-400">
                  {row.reorderLevel}
                </td>

                <td className="hidden px-4 py-3 text-zinc-400 lg:table-cell">
                  {row.unit}
                </td>
                <td className="px-4 py-3">
                  <InventoryStatusBadge item={row} />
                </td>

                {/* Actions: qty editor | edit | delete */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <QtyEditor row={row} onUpdateQty={onUpdateQty} />
                    <div className="mx-1 h-4 w-px bg-zinc-700" />
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
