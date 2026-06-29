/** POS order totals — subtotal, discount, tax, service, total (shared client + server). */

export function calculatePosDiscountAmount(subtotal, { type = "none", percent = 0, fixed = 0 } = {}) {
  const base = Math.max(0, Number(subtotal) || 0);
  if (!type || type === "none") return 0;

  if (type === "percent") {
    const pct = Math.min(100, Math.max(0, Number(percent) || 0));
    return parseFloat(Math.min(base, (base * pct) / 100).toFixed(2));
  }

  if (type === "fixed") {
    return parseFloat(Math.min(base, Math.max(0, Number(fixed) || 0)).toFixed(2));
  }

  return 0;
}

export function calculatePosTotals({
  items,
  subtotal: inputSubtotal,
  taxPercent = 0,
  serviceChargePercent = 0,
  discountType = "none",
  discountPercent = 0,
  discountFixed = 0,
  roundOffTotal = false,
}) {
  const subtotal =
    inputSubtotal != null
      ? Math.max(0, Number(inputSubtotal) || 0)
      : (items ?? []).reduce((s, i) => s + Number(i.price ?? 0) * Number(i.qty ?? 0), 0);

  const discountAmount = calculatePosDiscountAmount(subtotal, {
    type: discountType,
    percent: discountPercent,
    fixed: discountFixed,
  });

  const taxableBase = parseFloat(Math.max(0, subtotal - discountAmount).toFixed(2));
  const taxAmount = parseFloat(((taxableBase * Number(taxPercent || 0)) / 100).toFixed(2));
  const serviceCharge = parseFloat(
    ((taxableBase * Number(serviceChargePercent || 0)) / 100).toFixed(2)
  );
  let total = parseFloat((taxableBase + taxAmount + serviceCharge).toFixed(2));
  if (roundOffTotal) total = Math.round(total);

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discountType: discountAmount > 0 ? discountType : "none",
    discountPercent: discountType === "percent" ? Number(discountPercent) || 0 : 0,
    discountFixed: discountType === "fixed" ? Number(discountFixed) || 0 : 0,
    discountAmount,
    taxableBase,
    taxPercent: Number(taxPercent) || 0,
    taxAmount,
    serviceChargePercent: Number(serviceChargePercent) || 0,
    serviceCharge,
    total,
  };
}

export function resolvePosDiscountInput(enableDiscount, mode, value) {
  if (!enableDiscount) {
    return { discountType: "none", discountPercent: 0, discountFixed: 0 };
  }
  const num = parseFloat(String(value ?? "").trim());
  if (!Number.isFinite(num) || num <= 0) {
    return { discountType: "none", discountPercent: 0, discountFixed: 0 };
  }
  if (mode === "fixed") {
    return { discountType: "fixed", discountPercent: 0, discountFixed: num };
  }
  return { discountType: "percent", discountPercent: Math.min(100, num), discountFixed: 0 };
}
