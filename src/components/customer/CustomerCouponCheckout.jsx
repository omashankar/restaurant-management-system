"use client";

import CustomerCouponOffers from "@/components/customer/CustomerCouponOffers";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { customerClasses } from "@/lib/customerTheme";
import {
  dedupeCouponsByCode,
  formatCouponCustomerOffer,
  normalizeCouponCode,
  resolveCustomerCouponFromList,
  splitCouponSavings,
} from "@/lib/couponUtils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export default function CustomerCouponCheckout({
  coupons = [],
  subtotal = 0,
  orderType = null,
  paymentMethod = null,
  deliveryCharge = 0,
  itemQty = 0,
  pointsToRedeem = 0,
  appliedCoupon = null,
  onAppliedChange,
  onNotify,
}) {
  const uniqueCoupons = useMemo(
    () => dedupeCouponsByCode(coupons).filter((c) => c.active !== false),
    [coupons],
  );
  const [manualCode, setManualCode] = useState(appliedCoupon?.code ?? "");
  const onAppliedChangeRef = useRef(onAppliedChange);
  const onNotifyRef = useRef(onNotify);

  const validationContext = useMemo(
    () => ({
      orderType,
      paymentMethod,
      deliveryCharge,
      itemQty,
      hasPointsApplied: pointsToRedeem > 0,
    }),
    [orderType, paymentMethod, deliveryCharge, itemQty, pointsToRedeem],
  );

  useEffect(() => {
    onAppliedChangeRef.current = onAppliedChange;
    onNotifyRef.current = onNotify;
  }, [onAppliedChange, onNotify]);

  useEffect(() => {
    if (appliedCoupon?.code) setManualCode(appliedCoupon.code);
  }, [appliedCoupon?.code]);

  useEffect(() => {
    if (!appliedCoupon?.code) return;
    const check = resolveCustomerCouponFromList(uniqueCoupons, appliedCoupon.code, subtotal, validationContext);
    if (!check.valid) {
      onAppliedChangeRef.current?.(null);
      setManualCode("");
      onNotifyRef.current?.(check.error ?? "Coupon removed — not valid for this order.", "error");
    }
  }, [subtotal, appliedCoupon?.code, uniqueCoupons, validationContext]);

  const apply = useCallback(
    (codeOverride) => {
      const code = normalizeCouponCode(codeOverride ?? manualCode);
      if (!code) {
        onNotifyRef.current?.("Enter a coupon code.", "error");
        return;
      }
      setManualCode(code);
      const check = resolveCustomerCouponFromList(uniqueCoupons, code, subtotal, validationContext);
      if (!check.valid) {
        onAppliedChangeRef.current?.(null);
        onNotifyRef.current?.(check.error ?? "Invalid coupon code.", "error");
        return;
      }
      const found = uniqueCoupons.find((c) => c.code === code);
      onAppliedChangeRef.current?.(found ?? null);
      onNotifyRef.current?.(`Coupon ${code} applied.`);
    },
    [uniqueCoupons, subtotal, manualCode, validationContext],
  );

  const clear = useCallback(() => {
    onAppliedChangeRef.current?.(null);
    setManualCode("");
  }, []);

  const savings = appliedCoupon
    ? splitCouponSavings(appliedCoupon, subtotal, { deliveryCharge })
    : { subtotalDiscount: 0, deliveryDiscount: 0, totalDiscount: 0 };
  const { title } = appliedCoupon ? formatCouponCustomerOffer(appliedCoupon) : { title: "" };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-customer-text">Promo code</p>

      {appliedCoupon ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-xs font-black text-emerald-700">{appliedCoupon.code}</p>
            {title ? <p className="mt-0.5 text-[11px] text-customer-text">{title}</p> : null}
            <p className={`mt-1 text-[10px] font-semibold ${customerClasses.textSuccess}`}>
              You save {formatCustomerMoney(savings.totalDiscount)}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-full border border-customer-border px-3 py-1 text-[10px] font-semibold text-customer-muted hover:border-red-300 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          {uniqueCoupons.length > 0 ? (
            <CustomerCouponOffers
              coupons={uniqueCoupons}
              subtotal={subtotal}
              onApply={apply}
              mode="apply"
            />
          ) : null}
          <div>
            {uniqueCoupons.length > 0 ? (
              <p className="mb-1.5 text-[10px] text-customer-muted">Or enter a code manually</p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className={`${customerClasses.field} min-w-0 flex-1 rounded-full py-2.5 text-xs uppercase`}
              />
              <button
                type="button"
                onClick={() => apply()}
                disabled={!manualCode.trim() || subtotal <= 0}
                className="min-h-[44px] rounded-full border border-customer-border px-4 py-2.5 text-xs font-semibold text-customer-muted hover:border-customer-primary/30 hover:text-customer-primary disabled:cursor-not-allowed disabled:opacity-40 sm:shrink-0"
              >
                Apply
              </button>
            </div>
            {subtotal <= 0 ? (
              <p className="mt-1 text-[10px] text-customer-muted">Add items to apply a coupon.</p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
