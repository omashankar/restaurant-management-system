"use client";

import { ChevronRight, LayoutGrid, Users } from "lucide-react";

export default function PosTableSelectField({
  selectedTable,
  areaName,
  fieldError,
  onOpenPicker,
  onClear,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Table</p>
        {selectedTable ? (
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer text-[10px] font-medium text-red-400 hover:text-red-300"
          >
            Clear
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onOpenPicker}
        className={`cursor-pointer flex w-full min-w-0 items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition-all sm:gap-3 ${
          selectedTable
            ? "border-ra-primary-30 bg-ra-primary/[0.06] hover:border-ra-primary-40"
            : fieldError
              ? "border-red-500/30 bg-red-500/5 hover:border-red-500/40"
              : "admin-shell-border bg-[var(--admin-hover)] hover:border-[var(--admin-border)]"
        }`}
      >
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            selectedTable ? "bg-ra-primary/15 text-ra-primary" : "admin-surface-card admin-surface-muted"
          }`}
        >
          <LayoutGrid className="size-4" aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          {selectedTable ? (
            <>
              <span className="block text-sm font-semibold text-ra-primary-muted">
                Table {selectedTable.tableNumber}
              </span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] admin-surface-muted">
                {areaName ? <span>{areaName}</span> : null}
                <span className="inline-flex items-center gap-0.5">
                  <Users className="size-3" aria-hidden />
                  {selectedTable.capacity} seats
                </span>
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-semibold admin-shell-text">Choose area & table</span>
              <span className="mt-0.5 text-[11px] admin-surface-muted">Tap to open table picker</span>
            </>
          )}
        </span>

        <ChevronRight className="size-4 shrink-0 admin-surface-muted" aria-hidden />
      </button>

      {fieldError ? (
        <p className="mt-1.5 text-[10px] text-red-400">{fieldError}</p>
      ) : !selectedTable ? (
        <p className="mt-1.5 text-[10px] text-amber-500/70">Required before adding customer</p>
      ) : null}
    </div>
  );
}

export function PosSetupHint({
  message,
  actionLabel,
  onAction,
  tone = "amber",
}) {
  const styles =
    tone === "red"
      ? "border-red-500/20 bg-red-500/10 text-red-400"
      : "border-amber-500/20 bg-amber-500/10 text-amber-400";

  return (
    <div className={`flex flex-col gap-2 rounded-lg border px-3 py-2 sm:flex-row sm:items-center sm:justify-between ${styles}`}>
      <p className="text-xs">{message}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="cursor-pointer shrink-0 rounded-lg border border-current/25 px-3 py-1 text-[11px] font-semibold hover:bg-white/5"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
