"use client";

import ItemTypeChipIcon, { FastFilterChipIcon } from "@/components/menu/ItemTypeChipIcon";
import CategoryTabs from "@/components/pos/CategoryTabs";
import ListToolbar from "@/components/ui/ListToolbar";

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

      <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto scroll-px-1 px-1 pb-0.5 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {["all", "veg", "non-veg", "egg", "drink", "halal", "other"]
          .filter((t) => t === "all" || availableItemTypes.includes(t))
          .map((t) => {
            const active = activeItemType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onItemTypeChange(t)}
                className={`cursor-pointer inline-flex shrink-0 items-center gap-1.5 rounded-full border box-border px-3 py-1.5 text-xs font-semibold transition-[background-color,color] ${
                  active
                    ? "border-ra-primary/25 bg-ra-primary/20 text-ra-primary"
                    : "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
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
          className={`cursor-pointer inline-flex shrink-0 items-center gap-1.5 rounded-full border box-border px-3 py-1.5 text-xs font-semibold transition-[background-color,color] ${
            fastOnly
              ? "border-amber-500/30 bg-amber-500/20 text-amber-300"
              : "border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-shell-text"
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
