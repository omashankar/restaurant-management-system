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
    <div className="inline-flex max-w-full flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => { const n = Math.max(0, (parseInt(val,10)||0) - 1); setVal(String(n)); setDirty(true); onUpdateQty?.(row, -1); }}
        className="cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-lg border admin-shell-border admin-surface-muted transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
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
        className="w-16 shrink-0 rounded-lg border admin-shell-border bg-zinc-950/60 px-1.5 py-1 text-center text-sm tabular-nums admin-shell-text outline-none focus-ra-primary"
        aria-label="Quantity"
      />

      <button
        type="button"
        onClick={() => { const n = (parseInt(val,10)||0) + 1; setVal(String(n)); setDirty(true); onUpdateQty?.(row, +1); }}
        className="cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-lg border admin-shell-border admin-surface-muted transition-colors hover-border-ra-primary-40 hover-bg-ra-primary-10 hover-ra-primary"
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>

      <button
        type="button"
        onClick={handleRefresh}
        className={`cursor-pointer flex size-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
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

function rowAccentClass(status) {
  if (status === "out") return "bg-red-500/[0.06]";
  if (status === "low") return "bg-amber-500/[0.06]";
  return "";
}

export default function InventoryTable({ rows, onEdit, onDelete, onUpdateQty, footer }) {
  return (
    <div className="min-w-0 overflow-hidden admin-surface-card">
      <div className="space-y-2 p-3 md:hidden">
        {rows.map((row) => {
          const status = computeInventoryStatus(row);
          return (
            <div
              key={row.id}
              className={`rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3 ${rowAccentClass(status)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words font-medium admin-shell-text">{row.name}</p>
                    <InventoryStatusBadge item={row} />
                  </div>
                  <p className="mt-1 text-xs admin-surface-muted">{row.category}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <AdminTableIconButton onClick={() => onEdit(row)} aria-label={`Edit ${row.name}`}>
                    <Pencil className="size-4" />
                  </AdminTableIconButton>
                  <AdminTableIconButton variant="danger" onClick={() => onDelete(row)} aria-label={`Delete ${row.name}`}>
                    <Trash2 className="size-4" />
                  </AdminTableIconButton>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="admin-surface-faint">On hand</p>
                  <p className="mt-0.5 font-semibold tabular-nums admin-shell-text">{row.quantity}</p>
                </div>
                <div>
                  <p className="admin-surface-faint">Reorder</p>
                  <p className="mt-0.5 font-semibold tabular-nums admin-surface-muted">{row.reorderLevel}</p>
                </div>
                <div>
                  <p className="admin-surface-faint">Unit</p>
                  <p className="mt-0.5 truncate font-medium admin-surface-muted">{row.unit}</p>
                </div>
              </div>
              <div className="mt-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide admin-surface-faint">Update qty</p>
                <QtyEditor row={row} onUpdateQty={onUpdateQty} />
              </div>
            </div>
          );
        })}
        {footer}
      </div>

      <div className="hidden md:block">
        <DataTableShell>
          <AdminTable className="w-full min-w-[720px]">
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
                    <AdminTableTd className="max-w-[10rem] font-medium admin-shell-text sm:max-w-none">
                      <span className="block truncate">{row.name}</span>
                    </AdminTableTd>
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
      </div>
    </div>
  );
}
