"use client";

import { useCallback, useEffect, useState } from "react";

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
  minOrderAmount: 0,
};

/** Shared checkout settings (tax %, delivery fee, payments) for cart + checkout + success. */
export function useCheckoutMeta() {
  const [meta, setMeta] = useState(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/customer/checkout-meta", { cache: "no-store" });
      const data = await res.json();
      if (data?.success && data.meta) {
        setMeta({ ...DEFAULT_META, ...data.meta });
        setError("");
      }
    } catch {
      setError("Could not load pricing settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  return { meta, loading, error, refetch };
}

/** Cart/checkout totals aligned with server tax & delivery rules. */
export function calcOrderTotals({
  subtotal,
  orderType,
  taxPercentage = 8,
  deliveryCharge = 0,
  couponDiscount = 0,
  deliveryDiscount = 0,
  pointsDiscount = 0,
}) {
  const sub = Math.max(0, Number(subtotal) || 0);
  const rate = Math.max(0, Number(taxPercentage) || 0);
  const deliveryBase =
    orderType === "delivery" ? Math.max(0, Number(deliveryCharge) || 0) : 0;
  const deliveryWaived = Math.min(deliveryBase, Math.max(0, Number(deliveryDiscount) || 0));
  const delivery = Math.max(0, deliveryBase - deliveryWaived);
  const coupon = Math.max(0, Number(couponDiscount) || 0);
  const pts = Math.max(0, Number(pointsDiscount) || 0);
  const taxableSubtotal = Math.max(0, sub - coupon);
  const afterPoints = Math.max(0, taxableSubtotal - pts);
  const tax = afterPoints * (rate / 100);
  const total = Math.max(0, afterPoints + tax + delivery);
  return {
    subtotal: sub,
    tax,
    delivery,
    deliveryDiscount: deliveryWaived,
    couponDiscount: coupon,
    pointsDiscount: pts,
    total,
    taxRate: rate,
    taxableSubtotal,
    afterPoints,
  };
}
