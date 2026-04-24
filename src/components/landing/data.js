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
  { label: "Features",    href: "#features"    },
  { label: "How It Works",href: "#how-it-works" },
  { label: "Pricing",     href: "#pricing"      },
  { label: "Demo",        href: "#demo"         },
  { label: "Contact",     href: "#contact"      },
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

export const PRICING_PLANS = [
  {
    name:        "Starter",
    price:       { monthly: 29,  yearly: 23  },
    description: "Perfect for a single-location restaurant getting started.",
    highlight:   false,
    badge:       null,
    features: [
      { text: "1 Restaurant location",        included: true  },
      { text: "POS & Order Management",       included: true  },
      { text: "Menu & Category Management",   included: true  },
      { text: "Table Management",             included: true  },
      { text: "Basic Analytics",              included: true  },
      { text: "Inventory Management",         included: false },
      { text: "Staff Role Management",        included: false },
      { text: "Advanced Reports",             included: false },
      { text: "Priority Support",             included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    name:        "Pro",
    price:       { monthly: 79,  yearly: 63  },
    description: "For growing restaurants that need full operational control.",
    highlight:   true,
    badge:       "Most Popular",
    features: [
      { text: "Up to 3 Restaurant locations", included: true },
      { text: "POS & Order Management",       included: true },
      { text: "Menu & Category Management",   included: true },
      { text: "Table Management",             included: true },
      { text: "Advanced Analytics",           included: true },
      { text: "Inventory Management",         included: true },
      { text: "Staff Role Management",        included: true },
      { text: "Advanced Reports",             included: true },
      { text: "Priority Support",             included: false },
    ],
    cta: "Start Free Trial",
  },
  {
    name:        "Enterprise",
    price:       { monthly: 199, yearly: 159 },
    description: "For restaurant chains and franchises at scale.",
    highlight:   false,
    badge:       null,
    features: [
      { text: "Unlimited locations",          included: true },
      { text: "POS & Order Management",       included: true },
      { text: "Menu & Category Management",   included: true },
      { text: "Table Management",             included: true },
      { text: "Advanced Analytics",           included: true },
      { text: "Inventory Management",         included: true },
      { text: "Staff Role Management",        included: true },
      { text: "Advanced Reports",             included: true },
      { text: "Dedicated Support + SLA",      included: true },
    ],
    cta: "Contact Sales",
  },
];
