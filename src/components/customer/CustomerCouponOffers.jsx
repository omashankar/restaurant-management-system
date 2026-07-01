"use client";

import {
  dedupeCouponsByCode,
  formatCouponCustomerOffer,
  isCouponEligibleForSubtotal,
  normalizeCouponCode,
} from "@/lib/couponUtils";
import { Tag } from "lucide-react";
import { useMemo } from "react";

/**
 * Shows active online coupon codes to customers.
 * @param {"apply" | "browse" | "banner"} mode — apply on checkout, browse on cart, banner on menu
 */
export default function CustomerCouponOffers({
  coupons = [],
  subtotal = 0,
  appliedCode = null,
  onApply,
  mode = "browse",
  className = "",
}) {
  const uniqueCoupons = useMemo(
    () => dedupeCouponsByCode(coupons).filter((c) => c.active !== false),
    [coupons],
  );
  if (!uniqueCoupons.length) return null;

  if (mode === "banner") {
    return (
      <div
        className={`rounded-2xl border border-customer-primary/15 bg-customer-primary/5 px-3 py-2.5 ${className}`}
        role="note"
        aria-label="Available promo codes"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wide text-customer-primary">Offers</span>
          {uniqueCoupons.map((coupon) => {
            const { title } = formatCouponCustomerOffer(coupon);
            return (
              <span
                key={coupon.code}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-customer-primary/25 bg-[var(--customer-card)] px-3 py-1 text-[11px] text-customer-text"
                title={title}
              >
                <span className="font-mono font-black text-customer-primary">{coupon.code}</span>
                <span className="hidden text-customer-muted sm:inline">· {title}</span>
              </span>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-[10px] text-customer-muted">
          Tap a code at checkout to apply — discounts show in your order total.
        </p>
      </div>
    );
  }

  const normalizedApplied = appliedCode ? normalizeCouponCode(appliedCode) : null;

  return (
    <div className={`rounded-2xl border border-customer-primary/20 bg-customer-cream/60 p-3.5 ${className}`}>
      <div className="mb-2.5 flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-customer-primary/15 text-customer-primary">
          <Tag className="size-3.5" aria-hidden />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-customer-primary">
            {mode === "apply" ? "Tap to apply" : "Available codes"}
          </p>
          {mode === "browse" ? (
            <p className="text-[10px] text-customer-muted">Use these at checkout</p>
          ) : (
            <p className="text-[10px] text-customer-muted">One coupon per order</p>
          )}
        </div>
      </div>

      <ul className="space-y-2">
        {uniqueCoupons.map((coupon) => {
          const { title, hint } = formatCouponCustomerOffer(coupon);
          const eligible = isCouponEligibleForSubtotal(coupon, subtotal);
          const applied = normalizedApplied === coupon.code;
          const canApply = mode === "apply" && onApply && eligible && !applied;

          return (
            <li
              key={coupon.code}
              className={`rounded-xl border px-3 py-2.5 ${
                applied
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : "border-customer-border bg-[var(--customer-card)]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-black tracking-wide text-customer-primary">
                    {coupon.code}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-customer-text">{title}</p>
                  {hint ? (
                    <p className="mt-0.5 text-[10px] text-customer-muted">{hint}</p>
                  ) : null}
                  {mode === "apply" && !eligible && coupon.minSubtotal != null ? (
                    <p className="mt-0.5 text-[10px] text-amber-600">
                      Add ₹{Math.max(0, Number(coupon.minSubtotal) - subtotal).toFixed(0)} more to use
                    </p>
                  ) : null}
                </div>

                {mode === "apply" ? (
                  <button
                    type="button"
                    disabled={!canApply}
                    onClick={() => onApply?.(coupon.code)}
                    className="shrink-0 rounded-full bg-customer-primary px-3 py-1.5 text-[10px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Apply
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
