"use client";

import ItemTypeChipIcon, { FastFilterChipIcon } from "@/components/menu/ItemTypeChipIcon";
import { ITEM_TYPE_META } from "@/types/menu";

const ALL_TYPES = ["all", "veg", "non-veg", "drink", "egg", "halal", "other"];

export default function ItemTypeFilter({
  activeItemType,
  onItemTypeChange,
  fastOnly,
  onFastToggle,
  availableTypes, // optional — if provided, only show types that exist in items
}) {
  // If availableTypes passed, filter to only those + "all"; else show all
  const types = availableTypes
    ? ["all", ...ALL_TYPES.filter((t) => t !== "all" && availableTypes.includes(t))]
    : ALL_TYPES;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {types.map((t) => {
        const active = activeItemType === t;
        const meta = ITEM_TYPE_META[t];
        return (
          <button
            key={t}
            type="button"
            onClick={() => onItemTypeChange(t)}
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
              active
                ? t === "all"
                  ? "bg-zinc-200 text-zinc-900"
                  : `ring-1 ${meta.badge} ${meta.border}`
                : "admin-surface-segment-btn hover:admin-shell-text"
            }`}
            aria-pressed={active}
          >
            {t !== "all" && <ItemTypeChipIcon type={t} />}
            {t === "all" ? "All Types" : meta.label}
          </button>
        );
      })}

      {/* Fast items toggle */}
      <button
        type="button"
        onClick={() => onFastToggle(!fastOnly)}
        className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
          fastOnly
            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
            : "admin-surface-segment-btn hover:admin-shell-text"
        }`}
        aria-pressed={fastOnly}
      >
        <FastFilterChipIcon />
        Fast (&lt;10 min)
      </button>
    </div>
  );
}
