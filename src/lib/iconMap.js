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
