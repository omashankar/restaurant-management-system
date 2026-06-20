import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { safeSearchPattern } from "@/lib/search";

const PER_CATEGORY = 4;

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function regexOr(search) {
  if (!search) return null;
  return { $regex: search, $options: "i" };
}

async function searchRestaurants(db, search) {
  const rx = regexOr(search);
  if (!rx) return [];

  const rows = await db.collection("restaurants").aggregate([
    {
      $lookup: {
        from: "users",
        localField: "ownerId",
        foreignField: "_id",
        as: "_ownerArr",
      },
    },
    { $addFields: { ownerDoc: { $arrayElemAt: ["$_ownerArr", 0] } } },
    { $project: { _ownerArr: 0 } },
    {
      $match: {
        $or: [
          { name: rx },
          { slug: rx },
          { phone: rx },
          { "ownerDoc.email": rx },
          { "ownerDoc.name": rx },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: PER_CATEGORY },
  ]).toArray();

  return rows.map((r) => {
    const owner = r.ownerDoc ?? null;
    const ownerEmail = owner?.email ?? r.ownerEmail ?? "";
    return {
      type: "restaurant",
      id: r._id.toString(),
      title: r.name ?? "Restaurant",
      sub: [owner?.name, ownerEmail, r.plan].filter(Boolean).join(" · ") || r.slug || "—",
      href: `/super-admin/restaurants?search=${encodeURIComponent(r.name ?? search)}`,
    };
  });
}

async function searchAdmins(db, search) {
  const rx = regexOr(search);
  if (!rx) return [];

  const users = await db.collection("users")
    .find(
      {
        role: "admin",
        $or: [{ name: rx }, { email: rx }],
      },
      { projection: { name: 1, email: 1, restaurantId: 1, status: 1 } },
    )
    .sort({ createdAt: -1 })
    .limit(PER_CATEGORY)
    .toArray();

  if (!users.length) return [];

  const restaurantIds = [...new Set(users.map((u) => u.restaurantId).filter(Boolean))];
  let restaurantMap = {};
  if (restaurantIds.length) {
    const restaurants = await db.collection("restaurants")
      .find({ _id: { $in: restaurantIds } }, { projection: { name: 1 } })
      .toArray();
    restaurantMap = Object.fromEntries(restaurants.map((r) => [r._id.toString(), r.name]));
  }

  return users.map((u) => {
    const restaurantName = u.restaurantId
      ? restaurantMap[u.restaurantId.toString()] ?? "Unknown"
      : "—";
    return {
      type: "admin",
      id: u._id.toString(),
      title: u.name ?? u.email,
      sub: `${u.email ?? ""} · ${restaurantName}`.trim(),
      href: `/super-admin/restaurants?search=${encodeURIComponent(u.email ?? u.name ?? search)}`,
    };
  });
}

async function searchPayments(db, search) {
  const rx = regexOr(search);
  if (!rx) return [];

  const payments = await db.collection("payments")
    .find({
      $or: [
        { restaurantName: rx },
        { adminEmail: rx },
        { invoiceId: rx },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(PER_CATEGORY)
    .toArray();

  return payments.map((p) => ({
    type: "payment",
    id: p._id.toString(),
    title: p.invoiceId ?? p.restaurantName ?? "Payment",
    sub: `${p.restaurantName ?? "—"} · ${p.status ?? "pending"} · ${p.amount ?? 0} ${p.currency ?? ""}`.trim(),
    href: `/super-admin/payments?search=${encodeURIComponent(p.invoiceId ?? p.restaurantName ?? search)}`,
  }));
}

async function searchContactMessages(db, search) {
  const rx = regexOr(search);
  if (!rx) return [];

  const messages = await db.collection("contact_messages")
    .find({
      $or: [
        { name: rx },
        { email: rx },
        { subject: rx },
        { message: rx },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .toArray();

  return messages.map((m) => ({
    type: "contact",
    id: m._id.toString(),
    title: m.subject || m.name || "Contact message",
    sub: `${m.name ?? "—"} · ${m.email ?? ""}`.trim(),
    href: `/super-admin/contact-inbox?q=${encodeURIComponent(m.email ?? m.name ?? search)}`,
  }));
}

async function searchSupportTickets(db, search) {
  const rx = regexOr(search);
  if (!rx) return [];

  const tickets = await db.collection("support_tickets")
    .find({
      $or: [
        { ticketCode: rx },
        { subject: rx },
        { message: rx },
      ],
    })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(3)
    .toArray();

  return tickets.map((t) => ({
    type: "ticket",
    id: t._id.toString(),
    title: t.subject || t.ticketCode || "Support ticket",
    sub: `${t.ticketCode ?? "—"} · ${t.status ?? "open"}`.trim(),
    href: `/super-admin/support-tickets?q=${encodeURIComponent(t.ticketCode ?? t.subject ?? search)}`,
  }));
}

/** GET /api/super-admin/search?q=... */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("q")?.trim() ?? "";
  if (raw.length < 2) {
    return Response.json({ success: false, error: "Enter at least 2 characters." }, { status: 400 });
  }
  if (raw.length > 80) {
    return Response.json({ success: false, error: "Search query is too long." }, { status: 400 });
  }

  const search = safeSearchPattern(raw);
  if (!search) {
    return Response.json({ success: true, results: [] });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const [restaurants, admins, payments, contacts, tickets] = await Promise.all([
      searchRestaurants(db, search),
      searchAdmins(db, search),
      searchPayments(db, search),
      searchContactMessages(db, search),
      searchSupportTickets(db, search),
    ]);

    return Response.json({
      success: true,
      results: [...restaurants, ...admins, ...payments, ...contacts, ...tickets],
    });
  } catch (err) {
    console.error("GET super-admin/search error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
