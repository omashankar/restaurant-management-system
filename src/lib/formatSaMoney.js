/** Super Admin / platform money display (default INR). */
export function formatSaMoney(amount, currency = "INR") {
  const n = Number(amount) || 0;
  const code = String(currency ?? "INR").toUpperCase();
  if (code === "INR") {
    return `₹${n.toLocaleString("en-IN")}`;
  }
  return `${code} ${n.toLocaleString()}`;
}
