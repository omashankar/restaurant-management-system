"use client";

import { adminControl } from "@/config/adminDesignSystem";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { Tag } from "lucide-react";

const QUICK_PERCENT = [5, 10, 15, 20];
const QUICK_FIXED = [50, 100, 200];

export default function PosDiscountSection({
  enabled = false,
  embedded = false,
  mode = "percent",
  value = "",
  discountAmount = 0,
  currency = "INR",
  onModeChange,
  onValueChange,
  onClear,
}) {
  if (!enabled) return null;

  const quickValues = mode === "fixed" ? QUICK_FIXED : QUICK_PERCENT;
  const inputPlaceholder = mode === "fixed" ? "Amount off" : "Percent off";
  const inputSuffix = mode === "fixed" ? "" : "%";

  return (
    <div className={`space-y-4 ${embedded ? "" : "rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5"}`}>
      {!embedded ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tag className="size-3.5 text-emerald-400" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300/90">
              Discount
            </p>
          </div>
          {discountAmount > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="cursor-pointer text-[10px] font-semibold text-emerald-300/80 hover:text-emerald-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-1">
        {[
          { id: "percent", label: "% Off" },
          { id: "fixed", label: "Fixed off", icon: Tag },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onModeChange?.(id)}
            className={`cursor-pointer inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition-all ${
              mode === id
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30"
                : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
            }`}
          >
            {Icon ? <Icon className="size-3.5 shrink-0" aria-hidden /> : null}
            {label}
          </button>
        ))}
      </div>

      <div className="relative">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          max={mode === "percent" ? 100 : undefined}
          step={mode === "percent" ? "1" : "0.01"}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          placeholder={inputPlaceholder}
          className={`${adminControl.input} w-full py-2 pr-8 text-xs focus-ra-primary`}
        />
        {inputSuffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] admin-surface-faint">
            {inputSuffix}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1">
        {quickValues.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onValueChange?.(String(n))}
            className="cursor-pointer rounded-md border admin-shell-border px-2 py-1 text-[10px] font-semibold admin-surface-muted hover:border-emerald-500/30 hover:text-emerald-200"
          >
            {mode === "fixed" ? formatAdminMoney(n, currency, { decimals: 0 }) : `${n}%`}
          </button>
        ))}
      </div>

      {discountAmount > 0 ? (
        <p className="text-[10px] text-emerald-300/90">
          Saves {formatAdminMoney(discountAmount, currency, { decimals: 2 })} · tax & service apply after discount
        </p>
      ) : (
        <p className="text-[10px] admin-surface-faint">Discount reduces subtotal before tax and service charge.</p>
      )}
    </div>
  );
}
