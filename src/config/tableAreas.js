import { Crown, Flame, Leaf, Snowflake, Star, Wind } from "lucide-react";

/**
 * Centralized area definitions.
 * id   — stored on each table row
 * label — display name
 * Icon  — lucide icon component
 * color — hardcoded Tailwind classes (active / hover / icon)
 */
export const TABLE_AREAS = [
  {
    id: "indoor",
    label: "Indoor",
    Icon: Leaf,
    activeClasses:  "border-emerald-500/60 bg-emerald-500/10 ring-1 ring-emerald-500/25 text-emerald-400",
    hoverClasses:   "hover:border-emerald-500/30 hover:bg-emerald-500/5",
    iconColor:      "text-emerald-400",
    iconBg:         "bg-emerald-500/10",
  },
  {
    id: "outdoor",
    label: "Outdoor",
    Icon: Wind,
    activeClasses:  "border-sky-500/60 bg-sky-500/10 ring-1 ring-sky-500/25 text-sky-400",
    hoverClasses:   "hover:border-sky-500/30 hover:bg-sky-500/5",
    iconColor:      "text-sky-400",
    iconBg:         "bg-sky-500/10",
  },
  {
    id: "ac-hall",
    label: "AC Hall",
    Icon: Snowflake,
    activeClasses:  "border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/25 text-indigo-400",
    hoverClasses:   "hover:border-indigo-500/30 hover:bg-indigo-500/5",
    iconColor:      "text-indigo-400",
    iconBg:         "bg-indigo-500/10",
  },
  {
    id: "non-ac",
    label: "Non-AC",
    Icon: Flame,
    activeClasses:  "border-amber-500/60 bg-amber-500/10 ring-1 ring-amber-500/25 text-amber-400",
    hoverClasses:   "hover:border-amber-500/30 hover:bg-amber-500/5",
    iconColor:      "text-amber-400",
    iconBg:         "bg-amber-500/10",
  },
  {
    id: "rooftop",
    label: "Rooftop",
    Icon: Star,
    activeClasses:  "border-rose-500/60 bg-rose-500/10 ring-1 ring-rose-500/25 text-rose-400",
    hoverClasses:   "hover:border-rose-500/30 hover:bg-rose-500/5",
    iconColor:      "text-rose-400",
    iconBg:         "bg-rose-500/10",
  },
  {
    id: "vip",
    label: "VIP",
    Icon: Crown,
    activeClasses:  "border-yellow-500/60 bg-yellow-500/10 ring-1 ring-yellow-500/25 text-yellow-400",
    hoverClasses:   "hover:border-yellow-500/30 hover:bg-yellow-500/5",
    iconColor:      "text-yellow-400",
    iconBg:         "bg-yellow-500/10",
  },
];

export const AREA_MAP = Object.fromEntries(TABLE_AREAS.map((a) => [a.id, a]));
