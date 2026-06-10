/** Shared coupon definitions for customer checkout (client + server). */

export const CUSTOMER_CHECKOUT_COUPONS = [
  { code: "SAVE10", label: "Save 10% (capped)", type: "percent", value: 10, maxDiscount: 10 },
  { code: "FLAT5", label: "Flat 5 off on orders 30+", type: "flat", value: 5, minSubtotal: 30 },
];

export function findCustomerCoupon(code) {
  const normalized = String(code ?? "").trim().toUpperCase();
  if (!normalized) return null;
  return CUSTOMER_CHECKOUT_COUPONS.find((c) => c.code === normalized) ?? null;
}

export function calculateCustomerCouponDiscount(coupon, subtotal) {
  const sub = Number(subtotal) || 0;
  if (!coupon || sub <= 0) return 0;

  if (coupon.type === "percent") {
    const raw = (sub * Number(coupon.value ?? 0)) / 100;
    const max = Number(coupon.maxDiscount ?? raw);
    return Math.min(raw, max);
  }

  if (coupon.minSubtotal != null && sub < Number(coupon.minSubtotal)) {
    return 0;
  }

  return Number(coupon.value ?? 0);
}

export function validateCustomerCoupon(code, subtotal) {
  const coupon = findCustomerCoupon(code);
  if (!coupon) {
    return { valid: false, error: "Invalid coupon code.", discount: 0, coupon: null };
  }

  const discount = calculateCustomerCouponDiscount(coupon, subtotal);
  if (coupon.minSubtotal != null && subtotal < Number(coupon.minSubtotal)) {
    return {
      valid: false,
      error: `Minimum order of ${coupon.minSubtotal} required for this coupon.`,
      discount: 0,
      coupon: null,
    };
  }

  if (discount <= 0) {
    return { valid: false, error: "Coupon cannot be applied to this order.", discount: 0, coupon: null };
  }

  return { valid: true, error: null, discount, coupon };
}
