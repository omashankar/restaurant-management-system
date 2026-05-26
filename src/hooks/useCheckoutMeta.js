"use client";

import { useEffect, useState } from "react";

const DEFAULT_META = {
  taxPercentage: 8,
  deliveryCharge: 0,
  onlinePaymentsAvailable: false,
  paymentMethods: {
    defaultMethod: "cod",
    cod: true,
    cashCounter: true,
    upi: true,
    card: true,
    netBanking: true,
    wallet: true,
    payLater: false,
    bankTransfer: false,
  },
  etaMinutes: { "dine-in": "15-20", takeaway: "20-30", delivery: "30-45" },
  coupons: [],
};

/** Shared checkout settings (tax %, delivery fee, payments) for cart + checkout + success. */
export function useCheckoutMeta() {
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/customer/checkout-meta", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data?.success && data.meta) {
          setMeta({ ...DEFAULT_META, ...data.meta });
        }
      } catch {
        if (!cancelled) setError("Could not load pricing settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { meta, loading, error };
}

/** Cart/checkout totals aligned with server tax & delivery rules. */
export function calcOrderTotals({
  subtotal,
  orderType,
  taxPercentage = 8,
  deliveryCharge = 0,
  couponDiscount = 0,
}) {
  const sub = Math.max(0, Number(subtotal) || 0);
  const rate = Math.max(0, Number(taxPercentage) || 0);
  const delivery =
    orderType === "delivery" ? Math.max(0, Number(deliveryCharge) || 0) : 0;
  const tax = sub * (rate / 100);
  const discount = Math.max(0, Number(couponDiscount) || 0);
  const total = Math.max(0, sub + tax + delivery - discount);
  return { subtotal: sub, tax, delivery, couponDiscount: discount, total, taxRate: rate };
}
