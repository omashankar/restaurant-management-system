/**
 * Shared icon resolver for the icon selection system.
 * - Admin panel: IconPicker uses the full lucide-react library directly.
 * - Frontend / landing page: use getIcon() to resolve a stored name → component.
 *
 * getIcon() uses the full lucide-react library so any icon the picker can
 * select will also render correctly on the frontend.
 */
import * as Icons from "lucide-react";

/** Resolve an icon name string → component. Falls back to Circle. */
export function getIcon(name) {
  const icon = Icons[name];
  // Accept both forwardRef objects (lucide v1+) and plain functions
  if (icon && (typeof icon === "object" || typeof icon === "function")) return icon;
  return Icons["Circle"];
}

/**
 * ICON_LIST — curated shortlist used by legacy code / quick references.
 * The full picker uses the complete lucide-react library (~3,800 icons).
 */
export const ICON_LIST = [
  "Users", "Utensils", "ShoppingCart", "Home", "Settings",
  "CreditCard", "Bell", "Star", "BarChart3", "CalendarClock",
  "ChefHat", "ClipboardList", "Clock", "Globe", "LayoutGrid",
  "Layers", "Mail", "MapPin", "Package", "PackageSearch",
  "Phone", "Table2", "Tag", "Truck", "UserRoundCheck",
  "Wallet", "Zap", "BookOpen",
];

/**
 * ICON_MAP — kept for any code that still imports it directly.
 * Resolves the curated ICON_LIST names to components.
 */
export const ICON_MAP = Object.fromEntries(
  ICON_LIST.map((name) => [name, Icons[name] ?? Icons["Circle"]])
);
