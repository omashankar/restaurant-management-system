"use client";

import { raInputCls } from "@/config/restaurantAdminTheme";
import {
  MENU_SIZE_OPTION_TYPES,
  buildPresetSizes,
  createEmptySizeRow,
  getCategorySizeGuidance,
  getSizeOptionMismatchWarning,
  normalizeMenuSizes,
} from "@/lib/menuItemSizes";
import { AlertTriangle, Check, Plus, Sparkles, Trash2 } from "lucide-react";

export default function MenuItemSizesField({
  sizeOptionType = "none",
  sizes = [],
  basePrice = "",
  categoryName = "",
  onChange,
  disabled = false,
}) {
  const rows = Array.isArray(sizes) ? sizes : [];
  const guidance = getCategorySizeGuidance(categoryName);
  const mismatchWarning = getSizeOptionMismatchWarning(categoryName, sizeOptionType);
  const normalized = normalizeMenuSizes(rows);
  const showSuggestion =
    categoryName && guidance.suggestedType !== sizeOptionType;

  const setType = (nextType) => {
    if (nextType === "none") {
      onChange?.({ sizeOptionType: "none", sizes: [] });
      return;
    }
    const presets =
      nextType === "custom"
        ? rows.length
          ? rows
          : [createEmptySizeRow(), createEmptySizeRow()]
        : buildPresetSizes(nextType, basePrice);
    onChange?.({ sizeOptionType: nextType, sizes: presets });
  };

  const applySuggestion = () => {
    setType(guidance.suggestedType);
  };

  const updateRow = (index, patch) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange?.({ sizeOptionType, sizes: next });
  };

  const removeRow = (index) => {
    const next = rows.filter((_, i) => i !== index);
    onChange?.({
      sizeOptionType: next.length ? sizeOptionType : "none",
      sizes: next,
    });
  };

  const addRow = () => {
    onChange?.({
      sizeOptionType: sizeOptionType === "none" ? "custom" : sizeOptionType,
      sizes: [...rows, createEmptySizeRow(basePrice)],
    });
  };

  const applyPresets = () => {
    if (sizeOptionType === "none" || sizeOptionType === "custom") return;
    onChange?.({
      sizeOptionType,
      sizes: buildPresetSizes(sizeOptionType, basePrice),
    });
  };

  return (
    <div className="space-y-4">
      {categoryName ? (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2.5">
          <p className="text-xs font-medium text-sky-200">
            <span className="font-semibold">{categoryName}</span> — {guidance.note}
          </p>
          {showSuggestion ? (
            <button
              type="button"
              disabled={disabled}
              onClick={applySuggestion}
              className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-200 ring-1 ring-sky-500/25 hover:bg-sky-500/25"
            >
              <Sparkles className="size-3.5" />
              Use recommended:{" "}
              {MENU_SIZE_OPTION_TYPES.find((t) => t.id === guidance.suggestedType)?.label}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-[11px] admin-surface-faint">Select a category first for size recommendations.</p>
      )}

      {mismatchWarning ? (
        <div className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{mismatchWarning}</span>
        </div>
      ) : null}

      <div>
        <p className="text-xs font-medium admin-surface-muted">How is this dish sold?</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {MENU_SIZE_OPTION_TYPES.map((type) => {
            const active = sizeOptionType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                disabled={disabled}
                onClick={() => setType(type.id)}
                className={`cursor-pointer rounded-xl border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-ra-primary/50 bg-ra-primary/10 ring-1 ring-ra-primary/30"
                    : "admin-shell-border bg-[var(--admin-surface-soft)] hover:border-ra-primary/25"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold admin-shell-text">{type.label}</span>
                  {active ? <Check className="size-4 shrink-0 text-ra-primary" /> : null}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug admin-surface-faint">{type.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {sizeOptionType !== "none" ? (
        <div className="space-y-3 rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide admin-surface-muted">
              Customer choices
            </p>
            {sizeOptionType !== "custom" ? (
              <button
                type="button"
                disabled={disabled || !basePrice}
                onClick={applyPresets}
                className="cursor-pointer text-[11px] font-semibold text-ra-primary hover:text-ra-primary-muted disabled:opacity-40"
              >
                Recalculate from price above
              </button>
            ) : null}
          </div>

          {!basePrice && sizeOptionType !== "custom" ? (
            <p className="text-[11px] text-amber-500/90">Enter price above first, then recalculate options.</p>
          ) : null}

          <div className="hidden gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide admin-surface-faint sm:grid sm:grid-cols-[1fr_6.5rem_2.5rem]">
            <span>Label (shown on bill)</span>
            <span>Price</span>
            <span />
          </div>

          <div className="space-y-2">
            {rows.map((row, index) => (
              <div key={row.id ?? index} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_6.5rem_2.5rem] sm:items-center">
                <div>
                  <label className="mb-1 block text-[10px] font-medium admin-surface-faint sm:sr-only">
                    Option name
                  </label>
                  <input
                    value={row.label ?? ""}
                    disabled={disabled}
                    onChange={(e) => updateRow(index, { label: e.target.value })}
                    placeholder="e.g. Half Plate"
                    className={raInputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium admin-surface-faint sm:sr-only">
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={disabled}
                    value={row.price ?? ""}
                    onChange={(e) => updateRow(index, { price: e.target.value })}
                    placeholder="0.00"
                    className={raInputCls}
                  />
                </div>
                <button
                  type="button"
                  disabled={disabled || rows.length <= 1}
                  onClick={() => removeRow(index)}
                  className="cursor-pointer flex size-10 items-center justify-center justify-self-end rounded-lg border admin-shell-border text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40 sm:justify-self-auto"
                  aria-label="Remove option"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={addRow}
            className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-ra-primary hover:text-ra-primary-muted"
          >
            <Plus className="size-3.5" />
            Add another option
          </button>

          {normalized.length > 0 ? (
            <p className="text-[11px] admin-surface-muted">
              POS & customer app will ask to pick one option before adding to cart.
            </p>
          ) : (
            <p className="text-[11px] text-amber-500/90">Add at least one option with name and price.</p>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed admin-shell-border px-3 py-2 text-[11px] admin-surface-muted">
          Single price — item goes straight to cart with no size popup.
        </p>
      )}
    </div>
  );
}
