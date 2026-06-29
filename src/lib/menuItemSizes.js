/** Menu item size / portion / variant helpers (POS + customer + admin). */

export const MENU_SIZE_OPTION_TYPES = [
  { id: "none", label: "Single price", hint: "Burger, drink, combo — direct add" },
  { id: "portion", label: "Half / Full plate", hint: "Biryani, dal, rice, curry" },
  { id: "variant", label: "Variants", hint: "Single/Double, Regular/Medium/Large" },
  { id: "pack", label: "Quantity pack", hint: "4 pcs / 8 pcs, Cup / Bowl" },
  { id: "custom", label: "Custom options", hint: "Add your own labels and prices" },
];

export function normalizeMenuSizes(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row, index) => {
      const label = String(row?.label ?? row?.name ?? "").trim();
      const price = Number(row?.price);
      const id = String(row?.id ?? label ?? `size-${index}`).trim() || `size-${index}`;
      if (!label || !Number.isFinite(price) || price < 0) return null;
      return { id, label, price };
    })
    .filter(Boolean);
}

export function itemHasSizes(item) {
  return normalizeMenuSizes(item?.sizes).length > 0;
}

export function getMenuItemDisplayPrice(item) {
  const sizes = normalizeMenuSizes(item?.sizes);
  if (!sizes.length) return Number(item?.price ?? 0);
  return Math.min(...sizes.map((s) => s.price));
}

export function formatMenuPriceRange(item, formatMoney) {
  const sizes = normalizeMenuSizes(item?.sizes);
  const base = Number(item?.price ?? 0);
  if (!sizes.length) return formatMoney(base);
  const prices = sizes.map((s) => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return formatMoney(min);
  return `From ${formatMoney(min)}`;
}

export function buildPresetSizes(optionType, basePrice = 0) {
  const base = Number(basePrice) || 0;
  const round = (n) => Math.max(0, Math.round(n * 100) / 100);

  switch (optionType) {
    case "portion":
      return [
        { id: "half", label: "Half Plate", price: round(base * 0.55) || base },
        { id: "full", label: "Full Plate", price: base || round(base * 2) },
      ];
    case "variant":
      return [
        { id: "regular", label: "Regular", price: base },
        { id: "medium", label: "Medium", price: round(base * 1.35) || base },
        { id: "large", label: "Large", price: round(base * 1.75) || base },
      ];
    case "pack":
      return [
        { id: "4pc", label: "4 pcs", price: base },
        { id: "8pc", label: "8 pcs", price: round(base * 1.85) || base },
      ];
    default:
      return [];
  }
}

export function createEmptySizeRow(basePrice = "") {
  return { id: `size-${Date.now()}`, label: "", price: basePrice === "" ? "" : String(basePrice) };
}

export function buildSizedCartLine(item, size) {
  const menuItemId = String(item.id ?? "");
  const sizeId = String(size.id);
  const lineId = `${menuItemId}::${sizeId}`;

  return {
    id: lineId,
    menuItemId,
    menuItemSizeId: sizeId,
    menuItemSizeLabel: size.label,
    name: `${item.name} (${size.label})`,
    price: Number(size.price),
    image: item.image ?? null,
    itemType: item.itemType,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    prepTime: item.prepTime,
    kitchenType: item.kitchenType,
  };
}

export function buildSimpleCartLine(item) {
  return {
    id: String(item.id ?? ""),
    menuItemId: String(item.id ?? ""),
    menuItemSizeId: null,
    menuItemSizeLabel: null,
    name: item.name,
    price: Number(item.price ?? 0),
    image: item.image ?? null,
    itemType: item.itemType,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    prepTime: item.prepTime,
    kitchenType: item.kitchenType,
  };
}

export function serializeMenuItemSizes(sizeOptionType, sizes) {
  const type = MENU_SIZE_OPTION_TYPES.some((t) => t.id === sizeOptionType)
    ? sizeOptionType
    : "none";
  const normalized = normalizeMenuSizes(sizes);
  if (type === "none" || !normalized.length) {
    return { sizeOptionType: "none", sizes: [] };
  }
  return { sizeOptionType: type, sizes: normalized };
}

export function sizeOptionLabel(optionType) {
  return MENU_SIZE_OPTION_TYPES.find((t) => t.id === optionType)?.label ?? "Options";
}

/** Category name → suggested size setup (admin form guidance). */
export function getCategorySizeGuidance(categoryName = "") {
  const name = String(categoryName ?? "").trim();
  const rules = [
    {
      match: /burger|sandwich|wrap/i,
      suggestedType: "variant",
      note: "Burgers: use Variants (Single / Double) or Single price — not Half Plate.",
      warnAgainst: ["portion"],
    },
    {
      match: /pizza/i,
      suggestedType: "variant",
      note: "Pizza: Regular / Medium / Large sizes.",
      warnAgainst: ["portion"],
    },
    {
      match: /drink|beverage|coffee|tea|juice|shake|lassi|soda/i,
      suggestedType: "none",
      note: "Drinks: one fixed selling price.",
      warnAgainst: ["portion", "variant", "pack"],
    },
    {
      match: /biryani|rice|dal|curry|main|indian|chinese|noodle/i,
      suggestedType: "portion",
      note: "Plate meals: Half Plate / Full Plate.",
      warnAgainst: [],
    },
    {
      match: /starter|appetizer|snack|wing|momo|roll|soup/i,
      suggestedType: "pack",
      note: "Starters: often sold by pieces (4 pcs / 8 pcs) or Cup / Bowl.",
      warnAgainst: ["portion"],
    },
    {
      match: /combo|meal|thali/i,
      suggestedType: "none",
      note: "Combos & thalis: fixed price, no size popup.",
      warnAgainst: ["portion", "variant", "pack"],
    },
    {
      match: /salad|pasta/i,
      suggestedType: "variant",
      note: "Salads & pasta: Small / Large or Regular / Large.",
      warnAgainst: ["portion"],
    },
  ];

  for (const rule of rules) {
    if (rule.match.test(name)) {
      return {
        suggestedType: rule.suggestedType,
        note: rule.note,
        warnAgainst: rule.warnAgainst ?? [],
      };
    }
  }

  return {
    suggestedType: "none",
    note: "Not sure? Use Single price. Add sizes only if customers choose Half/Full or sizes.",
    warnAgainst: [],
  };
}

export function getSizeOptionMismatchWarning(categoryName, sizeOptionType) {
  if (!categoryName || sizeOptionType === "none" || sizeOptionType === "custom") return null;
  const guidance = getCategorySizeGuidance(categoryName);
  if (!guidance.warnAgainst.includes(sizeOptionType)) return null;
  const chosen = sizeOptionLabel(sizeOptionType);
  return `“${categoryName}” usually doesn’t use “${chosen}”. ${guidance.note}`;
}

export function priceFieldLabel(sizeOptionType = "none") {
  switch (sizeOptionType) {
    case "portion":
      return "Full plate price *";
    case "variant":
      return "Regular / base price *";
    case "pack":
      return "Small pack price *";
    case "custom":
      return "Base reference price *";
    default:
      return "Selling price *";
  }
}

export function priceFieldHint(sizeOptionType = "none") {
  switch (sizeOptionType) {
    case "portion":
      return "Used to auto-fill Half & Full. Half is ~55% of this price.";
    case "variant":
      return "Regular size price. Medium & Large are calculated from this.";
    case "pack":
      return "Price for the smaller pack (e.g. 4 pcs).";
    case "custom":
      return "Optional reference — set each option price below.";
    default:
      return "Customers pay this exact amount (no size choice).";
  }
}

/** True when a cart line belongs to a menu item (simple id or sized `id::sizeId`). */
export function lineBelongsToMenuItem(lineId, menuItemId) {
  const id = String(menuItemId ?? "");
  const lid = String(lineId ?? "");
  if (!id || !lid) return false;
  return lid === id || lid.startsWith(`${id}::`);
}

/** Aggregate qty in cart for a menu item across all sizes / add-on variants. */
export function getMenuItemCartState(lines, menuItemId) {
  const id = String(menuItemId ?? "");
  if (!id) return null;
  let qty = 0;
  for (const line of lines ?? []) {
    if (lineBelongsToMenuItem(line.id, id)) {
      qty += Math.max(0, Number(line.qty) || 0);
    }
  }
  return qty > 0 ? { qty } : null;
}

/** Customer item detail page — aligned cart line ids with menu / POS. */
export function buildDetailCartLine(item, { selectedSize = null, selectedAddOns = [], qty = 1 } = {}) {
  const sizes = normalizeMenuSizes(item?.sizes);
  const size =
    selectedSize && sizes.some((s) => String(s.id) === String(selectedSize.id)) ? selectedSize : null;

  const base = size ? buildSizedCartLine(item, size) : buildSimpleCartLine(item);
  const addons = Array.isArray(selectedAddOns) ? selectedAddOns.filter(Boolean) : [];
  const addQty = Math.max(1, parseInt(qty, 10) || 1);

  if (!addons.length) {
    return { ...base, qty: addQty };
  }

  const addonIds = addons
    .map((a) => String(a.id))
    .sort()
    .join("-");
  const addonTotal = addons.reduce((sum, a) => sum + Number(a.price ?? 0), 0);
  const addonNames = addons.map((a) => a.name).join(", ");

  return {
    ...base,
    id: `${base.id}::addons-${addonIds}`,
    name: `${base.name} + ${addonNames}`,
    price: Math.round((base.price + addonTotal) * 100) / 100,
    qty: addQty,
  };
}
