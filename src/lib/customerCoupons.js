/**
 * @deprecated Use couponUtils + DB-backed /api/coupons. Kept for legacy imports.
 */
export {
  DEFAULT_COUPON_SEEDS as CUSTOMER_CHECKOUT_COUPONS,
  calculateCouponDiscount as calculateCustomerCouponDiscount,
  normalizeCouponCode,
  validateCouponDoc as validateCustomerCoupon,
} from "@/lib/couponUtils";
