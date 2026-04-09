"use client";

import { ITEM_TYPE_META } from "@/types/menu";
import { Zap } from "lucide-react";

const TYPES = ["all", "veg", "non-veg", "drink", "egg", "halal", "other"];

export default function ItemTypeFilter({
  activeItemType,
  onItemTypeChange,
  fastOnly,
  onFastToggle,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {TYPES.map((t) => {
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
                : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
            }`}
            aria-pressed={active}
          >
            {t !== "all" && (
              <span className={`size-2 rounded-full ${meta.dot}`} aria-hidden />
            )}
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
            : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
        }`}
        aria-pressed={fastOnly}
      >
        <Zap className="size-3" aria-hidden />
        Fast (&lt;10 min)
      </button>
    </div>
  );
}
