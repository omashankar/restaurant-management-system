import {
  INITIAL_CUSTOMERS,
  INITIAL_FLOOR_TABLES,
  INITIAL_MENU_ITEMS,
  INITIAL_RESERVATIONS,
  INITIAL_STAFF,
} from "@/lib/modulesData";
import { formatTimeSlot } from "@/lib/reservationUtils";

export const statsOverview = {
  salesToday: 12847.5,
  ordersToday: 186,
  customersToday: 74,
  salesChange: 12.4,
  ordersChange: -3.1,
  customersChange: 8.0,
};

export const recentOrders = [
  {
    id: "ORD-1042",
    table: "T12",
    customer: "Walk-in",
    total: 86.5,
    status: "completed",
    time: "2 min ago",
    items: 4,
  },
  {
    id: "ORD-1041",
    table: "T04",
    customer: "Sarah M.",
    total: 124.0,
    status: "preparing",
    time: "8 min ago",
    items: 6,
  },
  {
    id: "ORD-1040",
    table: "T09",
    customer: "Party (6)",
    total: 312.75,
    status: "new",
    time: "12 min ago",
    items: 11,
  },
  {
    id: "ORD-1039",
    table: "Bar-2",
    customer: "Alex K.",
    total: 42.0,
    status: "ready",
    time: "15 min ago",
    items: 3,
  },
];

export const revenueByDay = [
  { day: "Mon", amount: 4200 },
  { day: "Tue", amount: 5100 },
  { day: "Wed", amount: 4800 },
  { day: "Thu", amount: 6200 },
  { day: "Fri", amount: 8900 },
  { day: "Sat", amount: 11200 },
  { day: "Sun", amount: 9800 },
];

/** POS / legacy cards — snapshot from initial catalog */
export const menuItems = INITIAL_MENU_ITEMS.filter(
  (m) => m.status === "active"
).map((m) => ({
  id: m.id,
  name: m.name,
  price: m.price,
  category: m.categoryName,
  badge: m.badge,
}));

export const tables = INITIAL_FLOOR_TABLES.map((t) => ({
  id: t.tableNumber,
  seats: t.capacity,
  status: t.status,
  zone: t.zone,
}));

export const kitchenTickets = [
  {
    id: "K-1040",
    table: "T09",
    placedAt: "12:14 PM",
    status: "new",
    items: [
      { name: "Branzino", qty: 2, note: "No dairy" },
      { name: "Risotto", qty: 2 },
      { name: "Tartare", qty: 1 },
    ],
  },
  {
    id: "K-1041",
    table: "T04",
    placedAt: "12:08 PM",
    status: "preparing",
    items: [
      { name: "Ribeye", qty: 2, note: "Medium rare" },
      { name: "Burrata", qty: 2 },
    ],
  },
  {
    id: "K-1039",
    table: "Bar-2",
    placedAt: "12:05 PM",
    status: "ready",
    items: [{ name: "Tartare", qty: 1 }, { name: "Cake", qty: 2 }],
  },
];

/** Legacy list shape for any simple dashboard widgets */
export const reservations = INITIAL_RESERVATIONS.map((r) => ({
  id: r.id,
  name: `${r.customerName} — ${r.guests} pax`,
  time: formatTimeSlot(r.time),
  table: r.tableNumber,
  status: r.status,
}));

export const customers = INITIAL_CUSTOMERS.map((c) => ({
  id: c.id,
  name: c.name,
  visits: c.visits,
  spend: c.orderHistory.reduce((s, o) => s + o.total, 0),
  tier:
    c.visits >= 20 ? "Platinum" : c.visits >= 10 ? "Gold" : "Standard",
}));

export const staffMembers = INITIAL_STAFF.filter(
  (s) => s.status === "active"
).map((s) => ({
  id: s.id,
  name: s.name,
  role: s.role,
  shift: s.role === "Chef" ? "Evening" : "Split",
}));

export const inventoryAlerts = [
  { sku: "OIL-EVO", name: "Extra virgin olive oil", qty: 4, min: 8 },
  { sku: "BEEF-RIB", name: "Ribeye primal", qty: 12, min: 10 },
];
