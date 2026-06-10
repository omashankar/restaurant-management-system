/** @typedef {"in" | "low" | "out"} InventoryStatus */

export const INVENTORY_STATUS_LABELS = {
  in: "In stock",
  low: "Low stock",
  out: "Out of stock",
};

/** @type {Record<InventoryStatus, { badge: string; qty: string; row: string; card: string; icon: string; bar: string; track: string; input: string }>} */
export const INVENTORY_STATUS_STYLES = {
  in: {
    badge:
      "border-ra-primary-35 bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25",
    qty: "text-ra-primary",
    row: "border-l-2 border-l-ra-primary/55 bg-ra-primary/[0.06]",
    card: "border-ra-primary-30 bg-ra-primary-5 hover:border-ra-primary-45",
    icon: "bg-ra-primary-15 text-ra-primary",
    bar: "from-ra-primary to-ra-accent",
    track: "bg-ra-primary/10",
    input: "border-ra-primary-30 text-ra-primary focus:border-ra-primary-50",
  },
  low: {
    badge:
      "border-amber-500/40 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
    qty: "text-amber-400",
    row: "border-l-2 border-l-amber-500/55 bg-amber-500/[0.07]",
    card: "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/55",
    icon: "bg-amber-500/15 text-amber-400",
    bar: "from-amber-500/90 to-amber-600/65",
    track: "bg-amber-500/10",
    input: "border-amber-500/35 text-amber-300 focus:border-amber-500/60",
  },
  out: {
    badge:
      "border-red-500/40 bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
    qty: "text-red-400",
    row: "border-l-2 border-l-red-500/55 bg-red-500/[0.07]",
    card: "border-red-500/40 bg-red-500/5 hover:border-red-500/55",
    icon: "bg-red-500/15 text-red-400",
    bar: "from-red-500/90 to-red-600/70",
    track: "bg-red-500/10",
    input: "border-red-500/35 text-red-400 focus:border-red-500/60",
  },
};

/** @param {{ quantity?: number; reorderLevel?: number }} item */
export function computeInventoryStatus(item) {
  const q = Number(item.quantity) || 0;
  const r = Number(item.reorderLevel) || 0;
  if (q === 0) return "out";
  if (q <= r) return "low";
  return "in";
}

/** @param {InventoryStatus | string} status */
export function inventoryStatusStyles(status) {
  const key = status === "low" || status === "out" ? status : "in";
  return INVENTORY_STATUS_STYLES[key];
}

/** @param {InventoryStatus | string} status */
export function inventoryStatusBadgeCls(status) {
  return inventoryStatusStyles(status).badge;
}

/** @param {InventoryStatus | string} status */
export function inventoryQtyTextCls(status) {
  return inventoryStatusStyles(status).qty;
}

/** @param {InventoryStatus | string} status */
export function inventoryRowAccentCls(status) {
  return inventoryStatusStyles(status).row;
}

/** @param {InventoryStatus | string} status */
export function inventoryCardCls(status) {
  return inventoryStatusStyles(status).card;
}

/** @param {InventoryStatus | string} status */
export function inventoryIconCls(status) {
  return inventoryStatusStyles(status).icon;
}

/** @param {InventoryStatus | string} status */
export function inventoryStockBarCls(status) {
  return inventoryStatusStyles(status).bar;
}

/** @param {InventoryStatus | string} status */
export function inventoryStockTrackCls(status) {
  return inventoryStatusStyles(status).track;
}

/** @param {InventoryStatus | string} status */
export function inventoryQtyInputCls(status) {
  return inventoryStatusStyles(status).input;
}

/**
 * Target capacity for stock level bar (max level or estimated par × 2).
 * @param {{ reorderLevel?: number; maxLevel?: number | string }} item
 */
export function computeStockLevelTarget(item) {
  const reorder = Math.max(0, Number(item.reorderLevel) || 0);
  const maxRaw = item.maxLevel;
  if (maxRaw != null && maxRaw !== "" && Number(maxRaw) > 0) {
    return Number(maxRaw);
  }
  return Math.max(reorder * 2, reorder + 10, 1);
}

/**
 * Stock fill relative to target capacity (0–100%).
 * @param {{ quantity?: number; reorderLevel?: number; maxLevel?: number | string }} item
 */
export function computeStockLevelPct(item) {
  const q = Math.max(0, Number(item.quantity) || 0);
  const max = computeStockLevelTarget(item);
  if (q === 0) return 0;
  return Math.min(100, Math.round((q / max) * 100));
}

/** Reorder par marker position on the stock bar (0–100%), or null when not set. */
export function computeReorderMarkerPct(item) {
  const reorder = Math.max(0, Number(item.reorderLevel) || 0);
  const target = computeStockLevelTarget(item);
  if (reorder <= 0 || target <= 0) return null;
  return Math.min(100, Math.round((reorder / target) * 100));
}

/** Out → low → in, then lowest quantity first within each group. */
export function sortItemsForStockLevels(items) {
  const rank = { out: 0, low: 1, in: 2 };
  return [...items].sort((a, b) => {
    const sa = computeInventoryStatus(a);
    const sb = computeInventoryStatus(b);
    if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
    return (Number(a.quantity) || 0) - (Number(b.quantity) || 0);
  });
}
