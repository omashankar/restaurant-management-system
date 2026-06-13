import { getPlatformSettings } from "@/lib/platformSettings";

/** SaaS subscription rows in `payments` (food orders use `payment_transactions`). */
export const SUBSCRIPTION_PAYMENT_TYPES = ["subscription", "subscription_renewal"];

export const SUBSCRIPTION_PAYMENT_MATCH = {
  paymentType: { $in: SUBSCRIPTION_PAYMENT_TYPES },
};

/** @param {import("mongodb").Db} [db] */
export async function getPlatformCurrency(db) {
  const settings = await getPlatformSettings(db);
  const code =
    String(settings.currencies?.default ?? "").trim() ||
    String(settings.payment?.currency ?? "").trim() ||
    "INR";
  return code.toUpperCase();
}

export async function getSupportedCurrencies(db) {
  const settings = await getPlatformSettings(db);
  const list = settings.currencies?.supported;
  if (Array.isArray(list) && list.length > 0) {
    return list.map((c) => String(c).toUpperCase());
  }
  return ["INR", "USD"];
}

export function formatPlatformMoney(amount, currency = "INR") {
  const code = String(currency).toUpperCase();
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${code} ${Number(amount || 0).toFixed(2)}`;
  }
}

/** @param {import("mongodb").Db} db */
export async function resolvePaymentCurrency(db, requested) {
  const supported = await getSupportedCurrencies(db);
  const req = String(requested ?? "").toUpperCase();
  if (req && supported.includes(req)) return req;
  return getPlatformCurrency(db);
}
