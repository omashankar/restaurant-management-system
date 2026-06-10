"use client";

import {
  FastFilterChipIcon,
  ItemTypeFilterLabel,
} from "@/components/menu/ItemTypeChipIcon";
import { customerClasses } from "@/lib/customerTheme";
import { ITEM_TYPE_META } from "@/types/menu";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

function FoodTypeFilterSelect({ id, label, value, onChange, availableTypes, allTypesLabel }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const options = ["all", ...availableTypes];

  return (
    <div className="ct-menu-filter-field" ref={rootRef}>
      <span className="ct-menu-filter-label" id={`${id}-label`}>
        {label}
      </span>
      <div className="ct-select-wrap">
        <button
          type="button"
          id={id}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          onClick={() => setOpen((v) => !v)}
          className={`w-full ${customerClasses.selectChip}`}
        >
          <ItemTypeFilterLabel type={value} allTypesLabel={allTypesLabel} />
        </button>
        <ChevronDown className="ct-select-chevron size-4" aria-hidden />

        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="ct-food-type-menu"
          >
            {options.map((t) => {
              const selected = value === t;
              return (
                <li key={t} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`ct-food-type-menu__option${selected ? " ct-food-type-menu__option--active" : ""}`}
                    onClick={() => {
                      onChange(t);
                      setOpen(false);
                    }}
                  >
                    <ItemTypeFilterLabel type={t} allTypesLabel={allTypesLabel} />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function FilterSelect({ id, label, value, onChange, children, className = "" }) {
  return (
    <div className={`ct-menu-filter-field ${className}`}>
      <label htmlFor={id} className="ct-menu-filter-label">
        {label}
      </label>
      <div className="ct-select-wrap">
        <select
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full ${customerClasses.selectChip}`}
        >
          {children}
        </select>
        <ChevronDown className="ct-select-chevron size-4" aria-hidden />
      </div>
    </div>
  );
}

function fillLabel(template, vars) {
  return String(template ?? "")
    .replace("{count}", String(vars.count ?? ""))
    .replace("{total}", String(vars.total ?? ""));
}

export default function MenuFiltersBar({
  labels = {},
  activeCategory,
  onCategoryChange,
  activeCategories = [],
  activeType,
  onTypeChange,
  availableTypes = [],
  fastOnly,
  onFastToggle,
  hasFastItems,
  sortBy,
  onSortChange,
  hasFilters,
  onClearAll,
  filteredCount,
  totalCount,
  searchQuery = "",
  onClearSearch,
}) {
  const L = labels;
  const activeCategoryName =
    activeCategory === "all"
      ? null
      : activeCategories.find((c) => c.id === activeCategory)?.name;
  const activeTypeAriaLabel =
    activeType === "all"
      ? null
      : ITEM_TYPE_META[activeType]?.label ?? activeType;

  const q = searchQuery.trim();
  const activeTags = [
    q && {
      key: "search",
      label: `${L.searchTagPrefix?.trim() || "Search"}: ${q.length > 20 ? `${q.slice(0, 20)}…` : q}`,
      onRemove: () => onClearSearch?.(),
    },
    activeCategoryName && {
      key: "category",
      label: activeCategoryName,
      onRemove: () => onCategoryChange("all"),
    },
    activeTypeAriaLabel && {
      key: "type",
      ariaLabel: activeTypeAriaLabel,
      content: (
        <ItemTypeFilterLabel
          type={activeType}
          allTypesLabel={L.allTypesLabel?.trim() || "All types"}
        />
      ),
      onRemove: () => onTypeChange("all"),
    },
    fastOnly && {
      key: "fast",
      label: L.fastFilterLabel?.trim() || "Fast (<10 min)",
      onRemove: () => onFastToggle(false),
    },
  ].filter(Boolean);

  const countLabel =
    typeof filteredCount === "number" && typeof totalCount === "number"
      ? hasFilters
        ? fillLabel(L.showingOfLabel || "Showing {count} of {total} dishes", {
            count: filteredCount,
            total: totalCount,
          })
        : fillLabel(L.allDishesLabel || "{total} dishes available", {
            count: filteredCount,
            total: totalCount,
          })
      : null;

  return (
    <div className="ct-menu-filter-bar">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-customer-muted">
            <SlidersHorizontal className="size-4 shrink-0 text-customer-primary" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-customer-text">
              Refine menu
            </span>
          </div>
          {L.filterHelpText?.trim() ? (
            <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-customer-muted">
              {L.filterHelpText.trim()}
            </p>
          ) : null}
        </div>
        {countLabel ? (
          <p className="shrink-0 text-right text-xs font-medium text-customer-muted">
            {countLabel}
          </p>
        ) : null}
      </div>

      <div className="space-y-4">
        <div>
          <p className="ct-menu-filter-label mb-2">
            {L.categoryLabel?.trim() || "Category"}
          </p>
          <div className="flex min-w-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={(e) => {
                onCategoryChange("all");
                e.currentTarget.blur();
              }}
              className={activeCategory === "all" ? customerClasses.chipActive : customerClasses.chip}
            >
              {L.allCategoryLabel?.trim() || "All"}
            </button>
            {activeCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={(e) => {
                  onCategoryChange(c.id);
                  e.currentTarget.blur();
                }}
                className={activeCategory === c.id ? customerClasses.chipActive : customerClasses.chip}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="ct-menu-filter-controls">
          {availableTypes.length > 0 ? (
            <FoodTypeFilterSelect
              id="menu-filter-type"
              label={L.typeLabel?.trim() || "Food type"}
              value={activeType}
              onChange={onTypeChange}
              availableTypes={availableTypes}
              allTypesLabel={L.allTypesLabel?.trim() || "All types"}
            />
          ) : null}

          <FilterSelect
            id="menu-filter-sort"
            label={L.sortLabel?.trim() || "Sort by"}
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="default">{L.sortDefaultLabel?.trim() || "Default order"}</option>
            <option value="name">{L.sortNameLabel?.trim() || "Name A–Z"}</option>
            <option value="price-asc">{L.sortPriceAscLabel?.trim() || "Price: Low to High"}</option>
            <option value="price-desc">{L.sortPriceDescLabel?.trim() || "Price: High to Low"}</option>
            <option value="fast">{L.sortFastLabel?.trim() || "Fastest first"}</option>
          </FilterSelect>

          {hasFastItems ? (
            <div className="ct-menu-filter-field">
              <span className="ct-menu-filter-label">{L.quickLabel?.trim() || "Quick filter"}</span>
              <button
                type="button"
                onClick={(e) => {
                  onFastToggle(!fastOnly);
                  e.currentTarget.blur();
                }}
                className={`inline-flex w-full items-center justify-center gap-1.5 ${fastOnly ? customerClasses.chipActive : customerClasses.chip}`}
              >
                <FastFilterChipIcon />
                <span className="truncate">{L.fastFilterLabel?.trim() || "Fast (<10 min)"}</span>
              </button>
            </div>
          ) : null}

          {hasFilters ? (
            <div className="ct-menu-filter-field ct-menu-filter-field--action">
              <span className="ct-menu-filter-label invisible select-none" aria-hidden>
                .
              </span>
              <button
                type="button"
                onClick={onClearAll}
                className={`inline-flex w-full items-center justify-center gap-1.5 ${customerClasses.chip} !border-[color-mix(in_srgb,#ef4444_35%,var(--customer-border))] !text-[color-mix(in_srgb,#ef4444_78%,var(--customer-text))]`}
              >
                <X className="size-3.5 shrink-0" />
                {L.clearAllLabel?.trim() || "Clear all filters"}
              </button>
            </div>
          ) : null}
        </div>

        <AnimatePresence>
          {activeTags.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-customer-muted">
                {L.activeFiltersLabel?.trim() || "Applied"}
              </p>
              <div className="flex flex-wrap gap-2">
                {activeTags.map((tag) => (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={tag.onRemove}
                    className="inline-flex items-center gap-1 rounded-full border border-customer-primary/30 bg-[var(--customer-primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-customer-primary transition-colors hover:border-customer-primary/50"
                    aria-label={`Remove filter ${tag.ariaLabel ?? tag.label}`}
                  >
                    {tag.content ?? tag.label}
                    <X className="size-3 shrink-0 opacity-70" aria-hidden />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
