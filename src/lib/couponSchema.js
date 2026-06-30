/** Coupon module constants — shared client + server. */

export const COUPON_CHANNELS = ["online", "pos"];

export const COUPON_TYPES = [
  { id: "percent", label: "Percentage discount" },
  { id: "flat", label: "Fixed amount discount" },
  { id: "free_delivery", label: "Free delivery" },
];

export const COUPON_TYPE_IDS = COUPON_TYPES.map((t) => t.id);

export const ORDER_TYPES = [
  { id: "dine-in", label: "Dine-in" },
  { id: "takeaway", label: "Takeaway" },
  { id: "delivery", label: "Delivery" },
];

export const ORDER_TYPE_IDS = ORDER_TYPES.map((t) => t.id);

export const WEEKDAYS = [
  { id: 0, label: "Sun" },
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
];

export const CUSTOMER_ELIGIBILITY = [
  { id: "all", label: "All customers" },
  { id: "new", label: "New customers" },
  { id: "existing", label: "Existing customers" },
  { id: "vip", label: "VIP customers" },
  { id: "membership", label: "Membership holders" },
  { id: "birthday", label: "Birthday" },
  { id: "anniversary", label: "Anniversary" },
];

export const MENU_SCOPES = [
  { id: "all", label: "Entire menu" },
  { id: "categories", label: "Selected categories" },
  { id: "items", label: "Selected items" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { id: "cashCounter", label: "Cash" },
  { id: "cod", label: "Cash on delivery" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Credit card" },
  { id: "debitCard", label: "Debit card" },
  { id: "netBanking", label: "Net banking" },
  { id: "wallet", label: "Wallet" },
  { id: "payLater", label: "Pay later" },
  { id: "bankTransfer", label: "Bank transfer" },
];

export const PAYMENT_METHOD_IDS = PAYMENT_METHOD_OPTIONS.map((p) => p.id);

export function defaultCouponRules() {
  return {
    description: "",
    orderTypes: [...ORDER_TYPE_IDS],
    paymentMethods: [],
    applicableDays: WEEKDAYS.map((d) => d.id),
    startTime: null,
    endTime: null,
    maxSubtotal: null,
    minQty: null,
    applyBeforeTax: true,
    includeDelivery: false,
    customerEligibility: "all",
    menuScope: "all",
    categoryIds: [],
    itemIds: [],
    onePerCustomer: false,
    dailyLimit: null,
    monthlyLimit: null,
    allowWithPoints: true,
    preventStacking: true,
    autoApply: false,
  };
}

export function couponStatusLabel(coupon, now = new Date()) {
  if (!coupon || coupon.active === false) return "inactive";
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return "scheduled";
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return "expired";
  if (coupon.usageLimit != null && Number(coupon.usedCount) >= Number(coupon.usageLimit)) {
    return "exhausted";
  }
  return "active";
}

export const COUPON_STATUS_STYLES = {
  active: "bg-emerald-500/15 text-emerald-300",
  inactive: "bg-zinc-500/15 admin-surface-muted",
  scheduled: "bg-sky-500/15 text-sky-300",
  expired: "bg-amber-500/15 text-amber-300",
  exhausted: "bg-red-500/15 text-red-300",
};
