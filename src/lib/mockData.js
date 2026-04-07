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

// ─── Extended dashboard data ──────────────────────────────────────────────────

export const dashboardStats = {
  salesToday: 12847.5,
  salesChange: 12.4,
  ordersToday: 186,
  ordersChange: -3.1,
  totalCustomers: 1284,
  customersChange: 8.0,
  totalReservations: 24,
  reservationsChange: 5.2,
};

/** Monthly sales (last 6 months) */
export const monthlySales = [
  { month: "Nov", sales: 68400, orders: 920 },
  { month: "Dec", sales: 91200, orders: 1240 },
  { month: "Jan", sales: 74500, orders: 1010 },
  { month: "Feb", sales: 82300, orders: 1120 },
  { month: "Mar", sales: 95600, orders: 1290 },
  { month: "Apr", sales: 103200, orders: 1380 },
];

/** Previous period comparison */
export const salesComparison = {
  current: 103200,
  previous: 95600,
  change: 7.9,
};

/** Online vs offline split */
export const orderChannels = [
  { label: "Dine-In", value: 58, color: "#10b981" },
  { label: "Takeaway", value: 27, color: "#6366f1" },
  { label: "Delivery", value: 15, color: "#f59e0b" },
];

/** Top 5 dishes today */
export const topDishes = [
  { rank: 1, name: "Classic Smash Burger", orders: 42, revenue: 545.58, category: "Fast Food" },
  { rank: 2, name: "Crispy Chicken Wrap", orders: 35, revenue: 367.5, category: "Fast Food" },
  { rank: 3, name: "Chocolate Lava Cake", orders: 28, revenue: 251.72, category: "Desserts" },
  { rank: 4, name: "Iced Caramel Latte", orders: 24, revenue: 142.8, category: "Beverages" },
  { rank: 5, name: "Truffle Parmesan Fries", orders: 19, revenue: 137.75, category: "Fast Food" },
];

/** Extended recent orders for the table */
export const recentOrdersTable = [
  { id: "ORD-1042", customer: "Walk-in", type: "dine-in", table: "T12", amount: 86.5, status: "completed", time: "2 min ago" },
  { id: "ORD-1041", customer: "Sarah M.", type: "dine-in", table: "T04", amount: 124.0, status: "preparing", time: "8 min ago" },
  { id: "ORD-1040", customer: "Party (6)", type: "dine-in", table: "T09", amount: 312.75, status: "new", time: "12 min ago" },
  { id: "ORD-1039", customer: "Alex K.", type: "dine-in", table: "Bar-2", amount: 42.0, status: "ready", time: "15 min ago" },
  { id: "ORD-1038", customer: "Priya S.", type: "delivery", table: "—", amount: 67.25, status: "completed", time: "22 min ago" },
  { id: "ORD-1037", customer: "James O.", type: "takeaway", table: "—", amount: 38.5, status: "cancelled", time: "30 min ago" },
  { id: "ORD-1036", customer: "Mia N.", type: "dine-in", table: "T02", amount: 198.0, status: "completed", time: "41 min ago" },
];

/** Peak hours data */
export const peakHours = [
  { hour: "12PM", load: 45 },
  { hour: "1PM", load: 72 },
  { hour: "2PM", load: 58 },
  { hour: "6PM", load: 65 },
  { hour: "7PM", load: 88 },
  { hour: "8PM", load: 100 },
  { hour: "9PM", load: 94 },
  { hour: "10PM", load: 71 },
];

/** AI insights */
export const aiInsights = [
  { type: "positive", icon: "trending-up", text: "Sales increased by 18% compared to yesterday." },
  { type: "info", icon: "clock", text: "Peak hours today: 8 PM – 10 PM. Staff up accordingly." },
  { type: "info", icon: "star", text: "Most ordered dish: Classic Smash Burger (42 orders)." },
  { type: "warning", icon: "alert", text: "Low stock: Extra virgin olive oil (4 left, min 8) and Heirloom tomatoes (out of stock)." },
  { type: "positive", icon: "users", text: "Best performing category: Fast Food — 96 orders today." },
];

// ─── Analytics page data ──────────────────────────────────────────────────────

export const analyticsKpis = {
  totalRevenue: 103200,
  revenueChange: 7.9,
  totalOrders: 1380,
  ordersChange: 6.9,
  avgOrderValue: 74.8,
  avgOrderChange: 0.9,
  newCustomers: 142,
  newCustomersChange: 12.3,
  returningRate: 68,
  returningChange: 3.1,
};

export const dailyRevenue = [
  { label: "Mon", current: 4200, previous: 3800 },
  { label: "Tue", current: 5100, previous: 4600 },
  { label: "Wed", current: 4800, previous: 5200 },
  { label: "Thu", current: 6200, previous: 5700 },
  { label: "Fri", current: 8900, previous: 7800 },
  { label: "Sat", current: 11200, previous: 9900 },
  { label: "Sun", current: 9800, previous: 8600 },
];

export const hourlyOrders = [
  { hour: "10AM", orders: 8 },
  { hour: "11AM", orders: 14 },
  { hour: "12PM", orders: 38 },
  { hour: "1PM", orders: 52 },
  { hour: "2PM", orders: 31 },
  { hour: "3PM", orders: 18 },
  { hour: "4PM", orders: 12 },
  { hour: "5PM", orders: 22 },
  { hour: "6PM", orders: 44 },
  { hour: "7PM", orders: 61 },
  { hour: "8PM", orders: 74 },
  { hour: "9PM", orders: 68 },
  { hour: "10PM", orders: 42 },
];

export const customerGrowth = [
  { month: "Nov", newCustomers: 98, returning: 310 },
  { month: "Dec", newCustomers: 134, returning: 420 },
  { month: "Jan", newCustomers: 112, returning: 380 },
  { month: "Feb", newCustomers: 128, returning: 410 },
  { month: "Mar", newCustomers: 138, returning: 445 },
  { month: "Apr", newCustomers: 142, returning: 468 },
];

export const categoryRevenue = [
  { name: "Fast Food", revenue: 38400, orders: 520, color: "#10b981" },
  { name: "Beverages", revenue: 22100, orders: 380, color: "#6366f1" },
  { name: "Desserts", revenue: 18600, orders: 248, color: "#f59e0b" },
  { name: "Juice", revenue: 14200, orders: 196, color: "#06b6d4" },
];

export const topDishesByRevenue = [
  { name: "Classic Smash Burger", revenue: 545.58, qty: 42, category: "Fast Food" },
  { name: "Crispy Chicken Wrap", revenue: 367.5, qty: 35, category: "Fast Food" },
  { name: "Chocolate Lava Cake", revenue: 251.72, qty: 28, category: "Desserts" },
  { name: "Iced Caramel Latte", revenue: 142.8, qty: 24, category: "Beverages" },
  { name: "Truffle Parmesan Fries", revenue: 137.75, qty: 19, category: "Fast Food" },
];

export const bestDayOfWeek = [
  { day: "Mon", score: 42 },
  { day: "Tue", score: 51 },
  { day: "Wed", score: 48 },
  { day: "Thu", score: 62 },
  { day: "Fri", score: 89 },
  { day: "Sat", score: 100 },
  { day: "Sun", score: 88 },
];

export const smartInsights = [
  { type: "warning", icon: "trending-down", text: "Revenue dipped 4% on Wednesday vs last week. Consider a midweek promo." },
  { type: "info", icon: "clock", text: "Most active time: 8 PM. Ensure full staffing between 7–10 PM." },
  { type: "positive", icon: "star", text: "Top category this month: Fast Food — $38.4k revenue." },
  { type: "positive", icon: "users", text: "Returning customers up 3.1% — loyalty program is working." },
  { type: "positive", icon: "trending-up", text: "Saturday is your best day. Revenue 100% indexed vs weekly average." },
  { type: "warning", icon: "alert", text: "Low stock: Olive oil and Heirloom tomatoes need reorder." },
];
