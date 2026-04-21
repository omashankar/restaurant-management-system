import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/* ── GET /api/super-admin/payments
   Returns paginated transaction history across all tenants.
── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const status = searchParams.get("status") ?? "all";
    const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit  = 20;
    const skip   = (page - 1) * limit;

    const client = await clientPromise;
    const db     = client.db();

    const filter = {};
    if (status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { restaurantName: { $regex: search, $options: "i" } },
        { adminEmail:     { $regex: search, $options: "i" } },
        { invoiceId:      { $regex: search, $options: "i" } },
      ];
    }

    const [payments, total] = await Promise.all([
      db.collection("payments")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("payments").countDocuments(filter),
    ]);

    /* Revenue summary */
    const [revenuePipeline] = await db.collection("payments").aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]).toArray().catch(() => [null]);

    return Response.json({
      success: true,
      payments: payments.map((p) => ({
        id:             p._id.toString(),
        restaurantId:   p.restaurantId?.toString() ?? null,
        restaurantName: p.restaurantName ?? "—",
        adminEmail:     p.adminEmail    ?? "—",
        plan:           p.plan          ?? "—",
        amount:         p.amount        ?? 0,
        currency:       p.currency      ?? "USD",
        status:         p.status        ?? "pending",
        invoiceId:      p.invoiceId     ?? "—",
        method:         p.method        ?? "—",
        createdAt:      p.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalRevenue: revenuePipeline?.total ?? 0,
        paidCount:    revenuePipeline?.count ?? 0,
      },
    });
  } catch (err) {
    console.error("GET payments error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── POST /api/super-admin/payments — record a manual payment ── */
export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { restaurantId, plan, amount, currency = "USD", method = "manual", notes } = body;

  if (!restaurantId) return Response.json({ success: false, error: "restaurantId is required." }, { status: 400 });
  if (!amount || isNaN(Number(amount))) return Response.json({ success: false, error: "Valid amount is required." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    let _rid;
    try { _rid = new ObjectId(restaurantId); } catch { return Response.json({ success: false, error: "Invalid restaurantId." }, { status: 400 }); }

    const restaurant = await db.collection("restaurants").findOne({ _id: _rid }, { projection: { name: 1, ownerEmail: 1 } });
    if (!restaurant) return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });

    const invoiceId = `INV-${Date.now()}`;
    const result = await db.collection("payments").insertOne({
      restaurantId:   _rid,
      restaurantName: restaurant.name,
      adminEmail:     restaurant.ownerEmail ?? "—",
      plan:           plan ?? "—",
      amount:         Number(amount),
      currency,
      method,
      status:         "paid",
      invoiceId,
      notes:          notes?.trim() ?? "",
      createdAt:      new Date(),
    });

    return Response.json({
      success: true,
      payment: { id: result.insertedId.toString(), invoiceId, amount: Number(amount), status: "paid" },
    }, { status: 201 });
  } catch (err) {
    console.error("POST payment error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
