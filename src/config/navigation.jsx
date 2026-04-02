import {
  BarChart3,
  BookOpen,
  FolderTree,
  LayoutDashboard,
  ListOrdered,
  MonitorPlay,
  Package,
  Settings,
  ShoppingCart,
  Soup,
  Table2,
  UserCog,
  Users,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

/** @typedef {'admin'|'manager'|'waiter'|'chef'} Role */

/**
 * @type {(
 *   | {
 *       type: "link";
 *       href: string;
 *       label: string;
 *       Icon: import("lucide-react").LucideIcon;
 *       roles: Role[];
 *       limited?: boolean;
 *     }
 *   | {
 *       type: "group";
 *       id: string;
 *       label: string;
 *       Icon: import("lucide-react").LucideIcon;
 *       roles: Role[];
 *       limited?: boolean;
 *       children: Array<{
 *         href: string;
 *         label: string;
 *         Icon?: import("lucide-react").LucideIcon;
 *       }>;
 *     }
 * )[]}
 */
export const NAV_ITEMS = [
  {
    type: "link",
    href: "/dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    roles: ["admin", "manager"],
  },
  {
    type: "link",
    href: "/pos",
    label: "POS",
    Icon: ShoppingCart,
    roles: ["admin", "manager", "waiter"],
  },
  {
    type: "link",
    href: "/orders",
    label: "Orders",
    Icon: Soup,
    roles: ["admin", "manager", "waiter", "chef"],
  },
  {
    type: "link",
    href: "/kitchen",
    label: "Kitchen Display",
    Icon: MonitorPlay,
    roles: ["admin", "chef"],
  },
  {
    type: "group",
    id: "menu",
    label: "Menu",
    Icon: UtensilsCrossed,
    roles: ["admin", "manager"],
    children: [
      { href: "/menu/items", label: "Menu Items", Icon: ListOrdered },
      { href: "/menu/categories", label: "Categories", Icon: FolderTree },
      { href: "/menu/recipes", label: "Recipes", Icon: BookOpen },
    ],
  },
  {
    type: "link",
    href: "/tables",
    label: "Tables",
    Icon: Table2,
    roles: ["admin", "manager", "waiter"],
  },
  {
    type: "link",
    href: "/reservations",
    label: "Reservations",
    Icon: Wine,
    roles: ["admin", "manager", "waiter"],
    limited: true,
  },
  {
    type: "link",
    href: "/customers",
    label: "Customers",
    Icon: Users,
    roles: ["admin", "manager", "waiter"],
    limited: true,
  },
  {
    type: "link",
    href: "/staff",
    label: "Staff",
    Icon: UserCog,
    roles: ["admin"],
  },
  {
    type: "link",
    href: "/inventory",
    label: "Inventory",
    Icon: Package,
    roles: ["admin", "manager"],
    limited: true,
  },
  {
    type: "link",
    href: "/analytics",
    label: "Analytics",
    Icon: BarChart3,
    roles: ["admin", "manager"],
  },
  {
    type: "link",
    href: "/settings",
    label: "Settings",
    Icon: Settings,
    roles: ["admin"],
  },
];

export const MANAGER_STAFF_READ_ONLY = true;

/** @param {Role} role */
export function navForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

/**
 * @param {Role} role
 * @param {string} pathname
 */
export function canAccessPath(role, pathname) {
  /** @type {{ href: string; roles: Role[] }[]} */
  const rules = [];

  for (const item of NAV_ITEMS) {
    if (item.type === "link") {
      rules.push({ href: item.href, roles: item.roles });
    } else if (item.type === "group") {
      rules.push({ href: "/menu", roles: item.roles });
      for (const c of item.children) {
        rules.push({ href: c.href, roles: item.roles });
      }
    }
  }

  const match = rules.find(
    (r) => pathname === r.href || pathname.startsWith(`${r.href}/`)
  );
  if (!match) return true;
  return match.roles.includes(role);
}
