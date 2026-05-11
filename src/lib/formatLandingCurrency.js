/** Shared landing / admin preview price formatting */
export function formatLandingCurrency(amount, currencyCode = "INR") {
  const code =
    typeof currencyCode === "string" && currencyCode.trim() ? currencyCode.trim().toUpperCase() : "INR";
  const n = Number(amount);
  const value = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}
