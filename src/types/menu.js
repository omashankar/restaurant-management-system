/**
 * @typedef {'veg'|'non-veg'|'egg'|'drink'|'halal'|'other'} ItemType
 * @typedef {'default_kitchen'|'veg_kitchen'|'non_veg_kitchen'} KitchenType
 *
 * @typedef {Object} MenuItem
 * @property {string}      id
 * @property {string}      name
 * @property {string}      categoryId
 * @property {string}      categoryName
 * @property {number}      price
 * @property {string}      [description]
 * @property {'active'|'inactive'} status
 * @property {string|null} [badge]
 * @property {string|null} [image]
 * @property {ItemType}    [itemType]
 * @property {number}      [prepTime]       — minutes
 * @property {KitchenType} [kitchenType]
 */

/** @type {Record<ItemType, { label: string; dot: string; badge: string; border: string }>} */
export const ITEM_TYPE_META = {
  veg:     { label: "Veg",     dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/25", border: "border-emerald-500/30" },
  "non-veg": { label: "Non-Veg", dot: "bg-red-500",     badge: "bg-red-500/15 text-red-300 ring-red-500/25",           border: "border-red-500/30" },
  egg:     { label: "Egg",     dot: "bg-yellow-400",   badge: "bg-yellow-500/15 text-yellow-300 ring-yellow-500/25",   border: "border-yellow-500/30" },
  drink:   { label: "Drink",   dot: "bg-sky-500",      badge: "bg-sky-500/15 text-sky-300 ring-sky-500/25",            border: "border-sky-500/30" },
  halal:   { label: "Halal",   dot: "bg-teal-500",     badge: "bg-teal-500/15 text-teal-300 ring-teal-500/25",         border: "border-teal-500/30" },
  other:   { label: "Other",   dot: "bg-zinc-500",     badge: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",         border: "border-zinc-700" },
};

/** @type {Record<KitchenType, string>} */
export const KITCHEN_TYPE_LABELS = {
  default_kitchen: "Default Kitchen",
  veg_kitchen:     "Veg Kitchen",
  non_veg_kitchen: "Non-Veg Kitchen",
};

/** Maps itemType → kitchenType automatically */
export const DEFAULT_KITCHEN_FOR_TYPE = {
  veg:       "veg_kitchen",
  "non-veg": "non_veg_kitchen",
  egg:       "non_veg_kitchen",
  drink:     "default_kitchen",
  halal:     "non_veg_kitchen",
  other:     "default_kitchen",
};
