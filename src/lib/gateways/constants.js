/** Default routing order when gateway.priority is not set. */
export const GATEWAY_DEFAULT_PRIORITY = {
  razorpay: 1,
  cashfree: 2,
  stripe: 3,
  phonepe: 4,
  paytm: 5,
  payu: 6,
  paypal: 7,
  ccavenue: 8,
  offline: 9,
};

export const ONLINE_GATEWAY_IDS = [
  "razorpay",
  "cashfree",
  "stripe",
  "phonepe",
  "paytm",
  "payu",
  "paypal",
  "ccavenue",
];

export function appBaseUrl() {
  return String(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
