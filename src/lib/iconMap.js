import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  ChefHat,
  Circle,
  ClipboardList,
  Clock,
  Code2,
  CreditCard,
  Globe,
  Home,
  LayoutGrid,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PackageSearch,
  Phone,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Table2,
  Tag,
  Truck,
  Users,
  UserRoundCheck,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";

const ICON_COMPONENTS = {
  BarChart3,
  Bell,
  BookOpen,
  CalendarClock,
  ChefHat,
  Circle,
  ClipboardList,
  Clock,
  Code2,
  CreditCard,
  Globe,
  Home,
  LayoutGrid,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PackageSearch,
  Phone,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Table2,
  Tag,
  Truck,
  Users,
  UserRoundCheck,
  Utensils,
  Wallet,
  Zap,
};

/** Resolve an icon name string → component. Falls back to Circle. */
export function getIcon(name) {
  return ICON_COMPONENTS[name] ?? Circle;
}

/** Default landing role icons — used when stored value is missing or placeholder Circle. */
export const ROLE_ICON_BY_KEY = {
  admin: "UserRoundCheck",
  manager: "Users",
  waiter: "ClipboardList",
  chef: "ChefHat",
};

/** Pick a sensible role icon from stored value, role name, or item id. */
export function resolveRoleIcon(roleName, iconName, itemId = "") {
  const trimmed = String(iconName ?? "").trim();
  if (trimmed && trimmed !== "Circle" && ICON_COMPONENTS[trimmed]) {
    return trimmed;
  }

  const roleKey = String(roleName ?? "").trim().toLowerCase();
  if (ROLE_ICON_BY_KEY[roleKey]) return ROLE_ICON_BY_KEY[roleKey];

  const idKey = String(itemId ?? "").trim().toLowerCase();
  if (ROLE_ICON_BY_KEY[idKey]) return ROLE_ICON_BY_KEY[idKey];

  for (const [key, icon] of Object.entries(ROLE_ICON_BY_KEY)) {
    if (roleKey.includes(key)) return icon;
  }

  return trimmed && ICON_COMPONENTS[trimmed] ? trimmed : "Users";
}

export function getRoleIcon(roleName, iconName, itemId = "") {
  return getIcon(resolveRoleIcon(roleName, iconName, itemId));
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
  ICON_LIST.map((name) => [name, ICON_COMPONENTS[name] ?? Circle])
);
