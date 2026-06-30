"use client";

import { adminControl } from "@/config/adminDesignSystem";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { Loader2, Tag, Ticket } from "lucide-react";
import { useEffect, useState } from "react";

const QUICK_PERCENT = [5, 10, 15, 20];
const QUICK_FIXED = [50, 100, 200];

export default function PosDiscountSection({
  enabled = false,
  embedded = false,
  mode = "percent",
  value = "",
  discountAmount = 0,
  currency = "INR",
  subtotal = 0,
  appliedCoupon = null,
  couponError = "",
  couponLoading = false,
  onModeChange,
  onValueChange,
  onClear,
  onApplyCoupon,
  onClearCoupon,
}) {
  const [tab, setTab] = useState(appliedCoupon ? "coupon" : "manual");
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code ?? "");

  useEffect(() => {
    if (appliedCoupon?.code) {
      setTab("coupon");
      setCouponCode(appliedCoupon.code);
    }
  }, [appliedCoupon?.code]);

  if (!enabled) return null;

  const quickValues = mode === "fixed" ? QUICK_FIXED : QUICK_PERCENT;
  const inputPlaceholder = mode === "fixed" ? "Amount off" : "Percent off";
  const inputSuffix = mode === "fixed" ? "" : "%";
  const hasDiscount = discountAmount > 0;

  const handleApplyCoupon = () => {
    onApplyCoupon?.(couponCode.trim().toUpperCase());
  };

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
          {hasDiscount ? (
            <button
              type="button"
              onClick={() => {
                onClear?.();
                onClearCoupon?.();
              }}
              className="cursor-pointer text-[10px] font-semibold text-emerald-300/80 hover:text-emerald-200"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-1">
        {[
          { id: "manual", label: "Manual" },
          { id: "coupon", label: "Coupon" },
        ].map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`cursor-pointer rounded-lg px-2 py-2 text-[11px] font-semibold transition-all ${
              tab === id
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/30"
                : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "manual" ? (
        <>
          <div className="grid grid-cols-2 gap-1">
            {[
              { id: "percent", label: "% Off" },
              { id: "fixed", label: "Fixed off", icon: Tag },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onClearCoupon?.();
                  onModeChange?.(id);
                }}
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
              onChange={(e) => {
                onClearCoupon?.();
                onValueChange?.(e.target.value);
              }}
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
                onClick={() => {
                  onClearCoupon?.();
                  onValueChange?.(String(n));
                }}
                className="cursor-pointer rounded-md border admin-shell-border px-2 py-1 text-[10px] font-semibold admin-surface-muted hover:border-emerald-500/30 hover:text-emerald-200"
              >
                {mode === "fixed" ? formatAdminMoney(n, currency, { decimals: 0 }) : `${n}%`}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {appliedCoupon ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              <div className="min-w-0">
                <p className="font-semibold">{appliedCoupon.code}</p>
                <p className="text-emerald-300/80">{appliedCoupon.label}</p>
              </div>
              <button
                type="button"
                onClick={onClearCoupon}
                className="shrink-0 cursor-pointer text-[10px] font-semibold text-emerald-300/80 hover:text-emerald-100"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Coupon code"
                  className={`${adminControl.input} min-w-0 flex-1 px-3 py-2 text-xs uppercase focus-ra-primary`}
                />
                <button
                  type="button"
                  disabled={couponLoading || !couponCode.trim() || subtotal <= 0}
                  onClick={handleApplyCoupon}
                  className="cursor-pointer shrink-0 rounded-lg bg-emerald-500/20 px-3 py-2 text-[11px] font-semibold text-emerald-200 ring-1 ring-emerald-500/30 disabled:opacity-40"
                >
                  {couponLoading ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
                </button>
              </div>
              {couponError ? <p className="text-[10px] text-red-400">{couponError}</p> : null}
            </>
          )}
          <p className="flex items-center gap-1.5 text-[10px] admin-surface-faint">
            <Ticket className="size-3" aria-hidden />
            Same codes as online checkout (Menu → Coupons).
          </p>
        </div>
      )}

      {hasDiscount ? (
        <p className="text-[10px] text-emerald-300/90">
          Saves {formatAdminMoney(discountAmount, currency, { decimals: 2 })} · tax & service apply after discount
        </p>
      ) : (
        <p className="text-[10px] admin-surface-faint">Discount reduces subtotal before tax and service charge.</p>
      )}
    </div>
  );
}
