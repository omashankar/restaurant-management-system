/**
 * Hardcoded color classes per category color name.
 * Tailwind v4 requires static strings — no dynamic class construction.
 */
export const CATEGORY_COLORS = [
  { id: "emerald", label: "Green",  badge: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/25", dot: "bg-emerald-500", active: "border-emerald-500/60 bg-emerald-500/10 ring-emerald-500/25 text-emerald-400", hover: "hover:border-emerald-500/30 hover:bg-emerald-500/5" },
  { id: "sky",     label: "Blue",   badge: "bg-sky-500/15 text-sky-400 ring-sky-500/25",             dot: "bg-sky-500",     active: "border-sky-500/60 bg-sky-500/10 ring-sky-500/25 text-sky-400",             hover: "hover:border-sky-500/30 hover:bg-sky-500/5"     },
  { id: "indigo",  label: "Indigo", badge: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/25",   dot: "bg-indigo-500",  active: "border-indigo-500/60 bg-indigo-500/10 ring-indigo-500/25 text-indigo-400", hover: "hover:border-indigo-500/30 hover:bg-indigo-500/5"},
  { id: "amber",   label: "Amber",  badge: "bg-amber-500/15 text-amber-400 ring-amber-500/25",      dot: "bg-amber-500",   active: "border-amber-500/60 bg-amber-500/10 ring-amber-500/25 text-amber-400",     hover: "hover:border-amber-500/30 hover:bg-amber-500/5" },
  { id: "rose",    label: "Rose",   badge: "bg-rose-500/15 text-rose-400 ring-rose-500/25",         dot: "bg-rose-500",    active: "border-rose-500/60 bg-rose-500/10 ring-rose-500/25 text-rose-400",         hover: "hover:border-rose-500/30 hover:bg-rose-500/5"   },
  { id: "yellow",  label: "Yellow", badge: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/25",   dot: "bg-yellow-500",  active: "border-yellow-500/60 bg-yellow-500/10 ring-yellow-500/25 text-yellow-400", hover: "hover:border-yellow-500/30 hover:bg-yellow-500/5"},
  { id: "violet",  label: "Purple", badge: "bg-violet-500/15 text-violet-400 ring-violet-500/25",   dot: "bg-violet-500",  active: "border-violet-500/60 bg-violet-500/10 ring-violet-500/25 text-violet-400", hover: "hover:border-violet-500/30 hover:bg-violet-500/5"},
  { id: "zinc",    label: "Gray",   badge: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",         dot: "bg-zinc-500",    active: "border-zinc-500/60 bg-zinc-500/10 ring-zinc-500/25 text-zinc-400",         hover: "hover:border-zinc-500/30 hover:bg-zinc-500/5"   },
];

export const COLOR_MAP = Object.fromEntries(CATEGORY_COLORS.map((c) => [c.id, c]));

/** Get badge classes for a category color, fallback to zinc */
export function getCategoryBadge(color) {
  return COLOR_MAP[color]?.badge ?? COLOR_MAP.zinc.badge;
}

/** Get active card classes */
export function getCategoryActive(color) {
  return COLOR_MAP[color]?.active ?? COLOR_MAP.zinc.active;
}

/** Get hover card classes */
export function getCategoryHover(color) {
  return COLOR_MAP[color]?.hover ?? COLOR_MAP.zinc.hover;
}

/** Get dot color */
export function getCategoryDot(color) {
  return COLOR_MAP[color]?.dot ?? COLOR_MAP.zinc.dot;
}
