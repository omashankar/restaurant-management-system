"use client";

import ItemTypeChipIcon, { FastFilterChipIcon } from "@/components/menu/ItemTypeChipIcon";
import CategoryTabs from "@/components/pos/CategoryTabs";
import ListToolbar from "@/components/ui/ListToolbar";
import { adminShell } from "@/config/adminSurfaceClasses";

const TYPE_LABELS = {
  all: "All Types",
  veg: "Veg",
  "non-veg": "Non-Veg",
  egg: "Egg",
  drink: "Drink",
  halal: "Halal",
  other: "Other",
};

export default function PosMenuFilters({
  categories,
  activeCategory,
  onCategoryChange,
  availableItemTypes,
  activeItemType,
  onItemTypeChange,
  fastOnly,
  onFastOnlyChange,
  search,
  onSearchChange,
  itemCount,
}) {
  return (
    <div className="min-w-0 space-y-4">
      <CategoryTabs categories={categories} activeCategory={activeCategory} onChange={onCategoryChange} />

      <div className="flex min-w-0 w-full flex-wrap items-center gap-2">
        {["all", "veg", "non-veg", "egg", "drink", "halal", "other"]
          .filter((t) => t === "all" || availableItemTypes.includes(t))
          .map((t) => {
            const active = activeItemType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onItemTypeChange(t)}
                className={`cursor-pointer inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  active
                    ? "bg-ra-primary/20 text-ra-primary ring-1 ring-ra-primary-25"
                    : "border admin-shell-border bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                }`}
                aria-pressed={active}
              >
                {t !== "all" && <ItemTypeChipIcon type={t} />}
                {TYPE_LABELS[t]}
              </button>
            );
          })}
        <button
          type="button"
          onClick={() => onFastOnlyChange((v) => !v)}
          className={`cursor-pointer inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
            fastOnly
              ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
              : `admin-surface-card admin-surface-muted ${adminShell.ringSubtle} hover:admin-shell-text`
          }`}
          aria-pressed={fastOnly}
        >
          <FastFilterChipIcon />
          Fast (&lt;10 min)
        </button>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search menu (/)"
        endSlot={
          <span className="w-full shrink-0 rounded-lg border admin-shell-border px-2.5 py-1 text-center text-xs text-zinc-400 sm:w-auto sm:text-left">
            {itemCount} items
          </span>
        }
      />
    </div>
  );
}
