import {
  BarChart3,
  CalendarClock,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  PackageSearch,
  Table2,
  UserRoundCheck,
  Users,
} from "lucide-react";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Demo", href: "#demo" },
  { label: "Contact", href: "#contact" },
];

export const STEP_FLOW = [
  {
    n: "01",
    title: "Setup Restaurant",
    text: "Configure menu, pricing, taxes, and table layout in minutes.",
    Icon: LayoutGrid,
  },
  {
    n: "02",
    title: "Take Orders using POS",
    text: "Capture dine-in, takeaway, and delivery orders from one screen.",
    Icon: CreditCard,
  },
  {
    n: "03",
    title: "Kitchen prepares orders",
    text: "Route active orders to kitchen workflow without confusion.",
    Icon: ChefHat,
  },
  {
    n: "04",
    title: "Track inventory automatically",
    text: "Watch stock movement and low-stock alerts in real time.",
    Icon: PackageSearch,
  },
  {
    n: "05",
    title: "View reports & analytics",
    text: "Monitor sales and performance with clean visual dashboards.",
    Icon: BarChart3,
  },
];

export const FEATURES = [
  {
    title: "POS System",
    desc: "Dine-in, Takeaway, and Delivery with smooth checkout flow.",
    Icon: CreditCard,
  },
  {
    title: "Menu Management",
    desc: "Organize Categories, Items, and Recipes with quick updates.",
    Icon: LayoutGrid,
  },
  {
    title: "Inventory",
    desc: "Track stock levels with low-stock and out-of-stock alerts.",
    Icon: PackageSearch,
  },
  {
    title: "Table Management",
    desc: "View table availability, occupancy, and live service status.",
    Icon: Table2,
  },
  {
    title: "Reservations",
    desc: "Manage booking schedules and reduce overbooking conflicts.",
    Icon: CalendarClock,
  },
  {
    title: "Staff & Role Management",
    desc: "Assign roles and keep operations controlled by permissions.",
    Icon: Users,
  },
  {
    title: "Customer Management",
    desc: "Store customer history and improve repeat experience quality.",
    Icon: UserRoundCheck,
  },
  {
    title: "Analytics & Reports",
    desc: "Get insights for sales, orders, and operational efficiency.",
    Icon: BarChart3,
  },
];

export const ROLES = [
  {
    role: "Admin",
    desc: "Full control over modules, settings, and user access.",
    Icon: UserRoundCheck,
  },
  {
    role: "Manager",
    desc: "Handles daily operations, reports, and team supervision.",
    Icon: Users,
  },
  {
    role: "Waiter",
    desc: "Takes customer orders and manages table service quickly.",
    Icon: ClipboardList,
  },
  {
    role: "Chef",
    desc: "Tracks kitchen queue and prepares orders on time.",
    Icon: ChefHat,
  },
];

export const TESTIMONIALS = [
  {
    name: "Rahul Mehta",
    role: "Operations Manager",
    quote:
      "RMS helped us reduce billing errors and speed up service during peak hours.",
  },
  {
    name: "Nina D'Souza",
    role: "Restaurant Owner",
    quote:
      "The interface is simple, and our whole team adopted it without training issues.",
  },
  {
    name: "Arjun Patel",
    role: "Outlet Manager",
    quote:
      "Inventory alerts and reporting made daily decisions much faster.",
  },
];
