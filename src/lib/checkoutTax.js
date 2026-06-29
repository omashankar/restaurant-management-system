/** Billing GST % when configured; otherwise POS tax (same as in-store). */
export function resolveCheckoutTaxPercent(settingsDoc, paymentSettingsDoc) {
  const gstNumber = String(paymentSettingsDoc?.tax?.gstNumber ?? "").trim();
  const gstRaw = paymentSettingsDoc?.tax?.gstPercentage;
  const posRaw = settingsDoc?.pos?.taxPercentage;

  const hasGstRate =
    gstRaw !== undefined && gstRaw !== null && String(gstRaw).trim() !== "";
  const gstTax = hasGstRate ? Number(gstRaw) : NaN;
  const posTax = Number(posRaw);

  // Billing tax applies when GSTIN is set or a non-zero GST % was saved in Payment Settings.
  if (gstNumber || (Number.isFinite(gstTax) && gstTax > 0)) {
    if (Number.isFinite(gstTax)) return Math.max(0, gstTax);
    if (Number.isFinite(posTax)) return Math.max(0, posTax);
    return 8;
  }

  if (Number.isFinite(posTax)) return Math.max(0, posTax);

  return 8;
}
