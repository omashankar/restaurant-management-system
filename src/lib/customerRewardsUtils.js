/** 1 point = ₹1 discount at checkout (max 50% of order subtotal). */
export const POINTS_TO_RUPEE = 1;
export const MAX_POINTS_REDEEM_PERCENT = 50;

/** 1 reward point per ₹10 spent (rounded down). */
export function rewardPointsForOrderTotal(total) {
  const amount = Number(total ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / 10);
}

/** Max points redeemable for a given subtotal after coupon. */
export function maxRedeemablePoints(availablePoints, taxableSubtotal) {
  const pts = Math.max(0, Math.floor(Number(availablePoints ?? 0)));
  const sub = Math.max(0, Number(taxableSubtotal ?? 0));
  const capBySubtotal = Math.floor((sub * MAX_POINTS_REDEEM_PERCENT) / 100 / POINTS_TO_RUPEE);
  return Math.min(pts, capBySubtotal);
}

export function pointsToDiscount(points) {
  const p = Math.max(0, Math.floor(Number(points ?? 0)));
  return Number((p * POINTS_TO_RUPEE).toFixed(2));
}
