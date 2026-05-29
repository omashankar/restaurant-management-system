/** Format amounts for admin dashboard (restaurant settings currency). */
export function formatAdminMoney(amount, currencyCode = "INR", { decimals } = {}) {
  const value = Number(amount) || 0;
  const code =
    typeof currencyCode === "string" && currencyCode.trim()
      ? currencyCode.trim().toUpperCase()
      : "INR";
  const fractionDigits = decimals ?? (value % 1 === 0 ? 0 : 2);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString()}`;
  }
}
