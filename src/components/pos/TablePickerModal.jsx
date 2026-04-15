"use client";

import { useModuleData } from "@/context/ModuleDataContext";
import { getCategoryBadge } from "@/lib/tableCategoryColors";
import { Check, Users, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function TablePickerModal({ open, selectedTableId, onSelect, onClose }) {
  const { floorTables, tableCategories } = useModuleData();
  const [activeArea, setActiveArea] = useState(null);

  const areas = useMemo(() => {
    const ids = new Set(floorTables.map((t) => t.categoryId).filter(Boolean));
    return tableCategories.filter((c) => ids.has(c.id));
  }, [floorTables, tableCategories]);

  const currentArea = activeArea ?? areas[0]?.id ?? null;

  const tablesInArea = useMemo(() =>
    floorTables.filter((t) => t.categoryId === currentArea),
    [floorTables, currentArea]);

  if (!open) return null;

  const handleSelect = (table) => {
    if (table.status === "occupied" || table.status === "reserved") return;
    onSelect(table.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" aria-label="Close"
        className="cursor-pointer absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose} />

      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-zinc-50">Select Table</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Choose an area then pick an available table</p>
          </div>
          <button type="button" onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
            <X className="size-5" />
          </button>
        </div>

        {/* Area tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 px-5 py-3 [scrollbar-width:none]">
          {areas.map((area) => {
            const isActive = currentArea === area.id;
            const freeCount = floorTables.filter(
              (t) => t.categoryId === area.id && t.status === "available"
            ).length;
            return (
              <button key={area.id} type="button"
                onClick={() => setActiveArea(area.id)}
                className={`cursor-pointer flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}>
                {area.name}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ${getCategoryBadge(area.color)}`}>
                  {freeCount} free
                </span>
              </button>
            );
          })}
        </div>

        {/* Tables grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {tablesInArea.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-600">No tables in this area.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {tablesInArea.map((table) => {
                const isBlocked = table.status === "occupied" || table.status === "reserved";
                const isSelected = selectedTableId === table.id;
                return (
                  <button key={table.id} type="button"
                    disabled={isBlocked}
                    onClick={() => handleSelect(table)}
                    className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                      isBlocked
                        ? "cursor-not-allowed border-zinc-800/50 bg-zinc-900/20 opacity-40"
                        : isSelected
                        ? "cursor-pointer border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/25 hover:-translate-y-0.5"
                        : "cursor-pointer border-zinc-800 bg-zinc-900/60 hover:-translate-y-0.5 hover:border-zinc-600 hover:shadow-lg"
                    }`}>
                    {isSelected && (
                      <span className="absolute right-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                    )}
                    <p className={`text-base font-bold ${isSelected ? "text-emerald-400" : isBlocked ? "text-zinc-600" : "text-zinc-100"}`}>
                      {table.tableNumber}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-zinc-500">
                      <Users className="size-3" />{table.capacity} persons
                    </div>
                    <span className={`mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isBlocked ? "bg-red-500/10 text-red-400"
                      : isSelected ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {isBlocked ? table.status : isSelected ? "Selected" : "Available"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-5 py-3">
          <p className="text-xs text-zinc-600">
            {selectedTableId ? "Table selected — click Confirm" : "No table selected"}
          </p>
          <button type="button" onClick={onClose}
            className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500">
            {selectedTableId ? "Confirm" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
