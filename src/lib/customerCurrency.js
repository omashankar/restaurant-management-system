import { formatLandingCurrency } from "@/lib/formatLandingCurrency";

/** Default storefront currency — matches Indian restaurant SaaS positioning */
export const CUSTOMER_CURRENCY_CODE = "INR";

export function formatCustomerMoney(amount) {
  return formatLandingCurrency(amount, CUSTOMER_CURRENCY_CODE);
}
