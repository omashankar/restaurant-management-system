"use client";

import { adminModalOverlay } from "@/config/adminSurfaceClasses";
import { useModuleData } from "@/context/ModuleDataContext";
import { getCategoryBadge } from "@/lib/tableCategoryColors";
import { Check, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export default function TablePickerModal({ open, selectedTableId, onSelect, onClose }) {
  const { floorTables, tableCategories } = useModuleData();
  const [activeArea, setActiveArea] = useState(null);

  const areas = useMemo(() => {
    const ids = new Set(floorTables.map((t) => t.categoryId).filter(Boolean));
    return tableCategories.filter((c) => ids.has(c.id));
  }, [floorTables, tableCategories]);

  const currentArea = activeArea ?? areas[0]?.id ?? null;

  const tablesInArea = useMemo(
    () => floorTables.filter((t) => t.categoryId === currentArea),
    [floorTables, currentArea]
  );

  const selectedTable = useMemo(
    () => floorTables.find((t) => t.id === selectedTableId) ?? null,
    [floorTables, selectedTableId]
  );

  const selectedAreaName = useMemo(() => {
    if (!selectedTable?.categoryId) return "";
    return tableCategories.find((c) => c.id === selectedTable.categoryId)?.name ?? "";
  }, [selectedTable, tableCategories]);

  useEffect(() => {
    if (!open) return;
    if (selectedTable?.categoryId) {
      setActiveArea(selectedTable.categoryId);
      return;
    }
    setActiveArea(areas[0]?.id ?? null);
  }, [open, selectedTable?.categoryId, areas]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (typeof document === "undefined" || !open) return null;

  const handleSelect = (table) => {
    if (table.status === "occupied" || table.status === "reserved") return;
    onSelect(table.id);
    onClose();
  };

  return createPortal(
    <div
      className={`${adminModalOverlay} sm:p-4`}
    >
      <button
        type="button"
        aria-label="Close"
        className="cursor-pointer absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select area and table"
        className="relative z-10 flex max-h-[min(92dvh,680px)] w-full min-w-0 max-w-full flex-col rounded-t-2xl border admin-shell-border bg-zinc-900 shadow-2xl shadow-black/60 sm:max-w-2xl sm:rounded-2xl"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-[var(--admin-border)]" aria-hidden />
        </div>

        <div className="flex min-w-0 items-start justify-between gap-2 border-b admin-shell-border px-4 py-3 sm:items-center sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1 pr-1">
            <h2 className="text-base font-bold text-zinc-50 sm:text-lg">Select area & table</h2>
            <p className="mt-0.5 break-words text-xs admin-surface-muted">
              Choose section, then pick an available table
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer shrink-0 rounded-lg p-2 admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-shell-text"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-w-0 shrink-0 border-b admin-shell-border px-4 py-3 sm:px-5">
          {areas.length === 0 ? (
            <p className="text-sm admin-surface-muted">No areas configured.</p>
          ) : (
            <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {areas.map((area) => {
                const isActive = currentArea === area.id;
                const freeCount = floorTables.filter(
                  (t) => t.categoryId === area.id && t.status === "available"
                ).length;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setActiveArea(area.id)}
                    className={`cursor-pointer flex min-h-11 max-w-[min(100%,15rem)] shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-all sm:max-w-none sm:px-4 ${
                      isActive
                        ? "border-ra-primary-30 bg-ra-primary/10 text-ra-primary-muted"
                        : "admin-shell-border bg-zinc-900/50 admin-surface-muted hover:border-zinc-700 hover:admin-shell-text"
                    }`}
                  >
                    <span className="min-w-0 truncate">{area.name}</span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ${getCategoryBadge(area.color)}`}
                    >
                      {freeCount} free
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {currentArea ? (
            <p className="mb-3 break-words text-xs font-semibold uppercase tracking-wider admin-surface-muted">
              {areas.find((a) => a.id === currentArea)?.name ?? "Tables"}
            </p>
          ) : null}
          {tablesInArea.length === 0 ? (
            <p className="py-10 text-center text-sm admin-surface-faint">No tables in this area.</p>
          ) : (
            <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
              {tablesInArea.map((table) => {
                const isBlocked = table.status === "occupied" || table.status === "reserved";
                const isSelected = selectedTableId === table.id;
                return (
                  <button
                    key={table.id}
                    type="button"
                    disabled={isBlocked}
                    onClick={() => handleSelect(table)}
                    className={`relative flex min-h-[5.5rem] min-w-0 w-full flex-col items-start rounded-2xl border p-2.5 text-left transition-all duration-200 sm:min-h-0 sm:p-4 ${
                      isBlocked
                        ? "cursor-not-allowed admin-shell-border/50 bg-zinc-900/20 opacity-40"
                        : isSelected
                          ? "cursor-pointer border-ra-primary-60 bg-ra-primary-10 ring-1 ring-ra-primary-25"
                          : "cursor-pointer admin-shell-border admin-surface-card hover:border-zinc-600 hover:shadow-lg"
                    }`}
                  >
                    {isSelected ? (
                      <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-ra-primary text-zinc-950 sm:right-2 sm:top-2">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : null}
                    <p
                      className={`max-w-full truncate pr-6 text-sm font-bold sm:text-base ${
                        isSelected ? "text-ra-primary" : isBlocked ? "admin-surface-faint" : "admin-shell-text"
                      }`}
                    >
                      {table.tableNumber}
                    </p>
                    <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] admin-surface-muted sm:mt-1.5 sm:text-xs">
                      <Users className="size-3 shrink-0" aria-hidden />
                      <span className="truncate">{table.capacity} seats</span>
                    </div>
                    <span
                      className={`mt-1.5 max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-semibold sm:mt-2 ${
                        isBlocked
                          ? "bg-red-500/10 text-red-400"
                          : isSelected
                            ? "bg-ra-primary/20 text-ra-primary"
                            : "bg-ra-primary-10 text-ra-primary"
                      }`}
                    >
                      {isBlocked ? table.status : isSelected ? "Selected" : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t admin-shell-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5">
          <p className="min-w-0 break-words text-center text-xs admin-surface-faint sm:text-left">
            {selectedTable
              ? `Selected: ${selectedTable.tableNumber}${selectedAreaName ? ` · ${selectedAreaName}` : ""}`
              : "Tap a free table to select"}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full cursor-pointer shrink-0 rounded-xl bg-ra-primary px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto sm:py-2"
          >
            {selectedTableId ? "Done" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
