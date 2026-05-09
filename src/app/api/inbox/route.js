import clientPromise from "@/lib/mongodb";
import { getTenantContext } from "@/lib/tenantDb";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";

function toIso(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function formatAgo(value) {
  if (!value) return "just now";
  const ms = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "just now";
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

async function buildSuperAdminItems(db) {
  const [recentRestaurants, failedPayments] = await Promise.all([
    db
      .collection("restaurants")
      .find({}, { projection: { name: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    db
      .collection("payments")
      .find({ status: { $in: ["failed", "overdue"] } }, { projection: { amount: 1, status: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray()
      .catch(() => []),
  ]);

  const notifications = [
    ...recentRestaurants.map((row) => ({
      key: `restaurant:${row._id}`,
      title: `New restaurant: ${row.name ?? "Unnamed"}`,
      body: "A new tenant was registered on the platform.",
      createdAt: toIso(row.createdAt),
      href: "/super-admin/restaurants",
    })),
    ...failedPayments.map((row) => ({
      key: `payment:${row._id}`,
      title: "Payment issue detected",
      body: `Payment marked as ${row.status} (${Number(row.amount ?? 0).toFixed(2)}).`,
      createdAt: toIso(row.createdAt),
      href: "/super-admin/payments",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, 8);

  const messages = await db
    .collection("platform_messages")
    .find(
      { $or: [{ role: "super_admin" }, { role: "all" }] },
      { projection: { title: 1, body: 1, createdAt: 1 } }
    )
    .sort({ createdAt: -1 })
    .limit(8)
    .toArray()
    .catch(() => []);

  return {
    messages: messages.map((row) => ({
      key: `msg:${row._id}`,
      title: row.title ?? "Platform update",
      body: row.body ?? "New platform message received.",
      createdAt: toIso(row.createdAt),
      href: "/super-admin/logs",
    })),
    notifications,
  };
}

async function buildTenantItems(db, tenantFilter) {
  const [orders, reservations, lowStock, requests] = await Promise.all([
    db
      .collection("orders")
      .find({ ...tenantFilter, status: { $in: ["new", "preparing"] } }, { projection: { orderId: 1, status: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    db
      .collection("reservations")
      .find({ ...tenantFilter, status: { $in: ["pending", "confirmed"] } }, { projection: { customerName: 1, guests: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray(),
    db
      .collection("inventoryItems")
      .find({ ...tenantFilter, $expr: { $lte: ["$quantity", "$reorderLevel"] } }, { projection: { name: 1, quantity: 1, reorderLevel: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray(),
    db
      .collection("customer_dine_in_requests")
      .find({ ...tenantFilter, status: "pending" }, { projection: { action: 1, tableNumber: 1, createdAt: 1 } })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray()
      .catch(() => []),
  ]);

  const notifications = [
    ...orders.map((row) => ({
      key: `order:${row._id}`,
      title: `Order ${row.orderId ?? ""} is ${row.status}`,
      body: "Kitchen/dispatch attention needed.",
      createdAt: toIso(row.createdAt),
      href: "/orders",
    })),
    ...reservations.map((row) => ({
      key: `reservation:${row._id}`,
      title: "Reservation update",
      body: `${row.customerName ?? "Guest"} • ${Number(row.guests ?? 0)} guests`,
      createdAt: toIso(row.createdAt),
      href: "/reservations",
    })),
    ...lowStock.map((row) => ({
      key: `stock:${row._id}`,
      title: `Low stock: ${row.name ?? "Item"}`,
      body: `${Number(row.quantity ?? 0)} left (reorder at ${Number(row.reorderLevel ?? 0)}).`,
      createdAt: toIso(row.updatedAt),
      href: "/inventory",
    })),
  ]
    .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
    .slice(0, 8);

  const messages = requests.map((row) => ({
    key: `dinein:${row._id}`,
    title: row.action === "request_bill" ? "Bill requested" : "Waiter called",
    body: `Table ${row.tableNumber ?? "—"} requested assistance.`,
    createdAt: toIso(row.createdAt),
    href: "/orders",
    actionable: true,
    sourceCollection: "customer_dine_in_requests",
    sourceId: String(row._id),
  }));

  return { messages, notifications };
}

export async function GET(request) {
  const payload = verifyToken(getTokenFromRequest(request));
  if (!payload?.id || !payload?.role) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = String(payload.id);

    let data;
    if (payload.role === "super_admin") {
      data = await buildSuperAdminItems(db);
    } else {
      const { tenantFilter } = await getTenantContext(request, ["admin", "manager", "waiter", "chef"]);
      data = await buildTenantItems(db, tenantFilter);
    }

    const allKeys = [...data.messages, ...data.notifications].map((item) => item.key);
    const readRows = allKeys.length
      ? await db.collection("inbox_reads").find({ userId, key: { $in: allKeys } }).toArray()
      : [];
    const readSet = new Set(readRows.map((row) => row.key));

    const withState = (items) =>
      items.map((item) => ({
        ...item,
        read: readSet.has(item.key),
        ago: formatAgo(item.createdAt),
      }));

    const messages = withState(data.messages);
    const notifications = withState(data.notifications);

    return Response.json({
      success: true,
      messages,
      notifications,
      unread: {
        messages: messages.filter((m) => !m.read).length,
        notifications: notifications.filter((n) => !n.read).length,
      },
    });
  } catch (err) {
    console.error("inbox.GET failed:", err.message);
    return Response.json({ success: false, error: "Failed to load inbox." }, { status: 500 });
  }
}
