"use client";

import { computeInventoryStatus } from "@/components/inventory/inventoryUtils";
import InventoryStatusBadge from "@/components/inventory/InventoryStatusBadge";
import DataTableShell from "@/components/ui/DataTableShell";
import {
  AdminTable,
  AdminTableActionsCell,
  AdminTableBody,
  AdminTableHead,
  AdminTableHeadRow,
  AdminTableIconButton,
  AdminTableRow,
  AdminTableTd,
  AdminTableTh,
  AdminTableThActions,
} from "@/components/ui/AdminTable";
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
        className="cursor-pointer flex size-7 items-center justify-center rounded-lg border admin-shell-border admin-surface-muted transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
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
        className="w-16 rounded-lg border admin-shell-border bg-zinc-950/60 px-1.5 py-1 text-center text-sm tabular-nums admin-shell-text outline-none focus-ra-primary"
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={() => { const n = (parseInt(val,10)||0) + 1; setVal(String(n)); setDirty(true); onUpdateQty?.(row, +1); }}
        className="cursor-pointer flex size-7 items-center justify-center rounded-lg border admin-shell-border admin-surface-muted transition-colors hover-border-ra-primary-40 hover-bg-ra-primary-10 hover-ra-primary"
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={handleRefresh}
        className={`cursor-pointer flex size-7 items-center justify-center rounded-lg border transition-colors ${
          dirty
            ? "border-ra-primary-50 bg-ra-primary-15 text-ra-primary hover-bg-ra-primary-15"
            : "border-zinc-700 admin-surface-faint hover:border-zinc-600 hover:admin-surface-muted"
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
      <AdminTable className="w-full min-w-[800px]">
        <AdminTableHead>
          <AdminTableHeadRow>
            <AdminTableTh>Name</AdminTableTh>
            <AdminTableTh hidden="md">Category</AdminTableTh>
            <AdminTableTh align="center">QTY</AdminTableTh>
            <AdminTableTh align="center">Reorder</AdminTableTh>
            <AdminTableTh hidden="lg">Unit</AdminTableTh>
            <AdminTableTh>Status</AdminTableTh>
            <AdminTableTh>Update QTY</AdminTableTh>
            <AdminTableThActions />
          </AdminTableHeadRow>
        </AdminTableHead>
        <AdminTableBody className="divide-y-0">
          {rows.map((row) => {
            const status = computeInventoryStatus(row);
            const rowAccent =
              status === "out"
                ? "bg-red-500/[0.06]"
                : status === "low"
                  ? "bg-amber-500/[0.06]"
                  : "hover:bg-[var(--admin-hover)]";
            return (
              <AdminTableRow
                key={row.id}
                className={`border-b border-[var(--admin-border-subtle)] transition-colors duration-150 ${rowAccent}`}
              >
                <AdminTableTd className="font-medium admin-shell-text">{row.name}</AdminTableTd>
                <AdminTableTd hidden="md" className="admin-surface-muted">{row.category}</AdminTableTd>
                <AdminTableTd align="center" className="font-semibold admin-shell-text">{row.quantity}</AdminTableTd>
                <AdminTableTd align="center" className="admin-surface-muted">{row.reorderLevel}</AdminTableTd>
                <AdminTableTd hidden="lg" className="admin-surface-muted">{row.unit}</AdminTableTd>
                <AdminTableTd>
                  <InventoryStatusBadge item={row} />
                </AdminTableTd>
                <AdminTableTd>
                  <QtyEditor row={row} onUpdateQty={onUpdateQty} />
                </AdminTableTd>
                <AdminTableActionsCell>
                  <AdminTableIconButton onClick={() => onEdit(row)} aria-label={`Edit ${row.name}`}>
                    <Pencil className="size-4" />
                  </AdminTableIconButton>
                  <AdminTableIconButton variant="danger" onClick={() => onDelete(row)} aria-label={`Delete ${row.name}`}>
                    <Trash2 className="size-4" />
                  </AdminTableIconButton>
                </AdminTableActionsCell>
              </AdminTableRow>
            );
          })}
        </AdminTableBody>
      </AdminTable>
      {footer}
    </DataTableShell>
  );
}
