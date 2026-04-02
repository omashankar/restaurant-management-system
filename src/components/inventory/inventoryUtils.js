/** @param {{ quantity?: number; reorderLevel?: number }} item */
export function computeInventoryStatus(item) {
  const q = Number(item.quantity) || 0;
  const r = Number(item.reorderLevel) || 0;
  if (q === 0) return "out";
  if (q <= r) return "low";
  return "in";
}
