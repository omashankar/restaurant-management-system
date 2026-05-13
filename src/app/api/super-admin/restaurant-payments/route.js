/**
 * GET  /api/super-admin/restaurant-payments
 * Returns all restaurants with their payment settings overview + transaction summary.
 */
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 20;
    const skip  = (page - 1) * limit;

    const client = await clientPromise;
    const db     = client.db();

    const [restaurants, total] = await Promise.all([
      db.collection("restaurants")
        .find({ status: "active" })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("restaurants").countDocuments({ status: "active" }),
    ]);

    // Fetch payment settings and transaction summaries for each restaurant
    const restaurantIds = restaurants.map((r) => r._id);

    const [paymentSettingsDocs, txSummaries, payoutDocs] = await Promise.all([
      db.collection("restaurant_payment_settings")
        .find({ restaurantId: { $in: restaurantIds } })
        .toArray(),
      db.collection("payment_transactions").aggregate([
        { $match: { restaurantId: { $in: restaurantIds }, status: "paid" } },
        {
          $group: {
            _id:         "$restaurantId",
            totalAmount: { $sum: "$amount" },
            count:       { $sum: 1 },
          },
        },
      ]).toArray(),
      db.collection("payout_requests")
        .find({ restaurantId: { $in: restaurantIds }, status: "pending" })
        .toArray(),
    ]);

    const psMap  = Object.fromEntries(paymentSettingsDocs.map((d) => [d.restaurantId.toString(), d]));
    const txMap  = Object.fromEntries(txSummaries.map((s) => [s._id.toString(), s]));
    const poMap  = {};
    for (const p of payoutDocs) {
      const key = p.restaurantId.toString();
      poMap[key] = (poMap[key] ?? 0) + 1;
    }

    const result = restaurants.map((r) => {
      const rid = r._id.toString();
      const ps  = psMap[rid] ?? {};
      const tx  = txMap[rid] ?? { totalAmount: 0, count: 0 };
      const enabledGateways = Object.entries(ps?.gateways ?? {})
        .filter(([, v]) => v?.enabled)
        .map(([k]) => k);

      return {
        id:              rid,
        name:            r.name,
        ownerEmail:      r.ownerEmail ?? "—",
        status:          r.status,
        gatewaysEnabled: enabledGateways,
        methodsCount:    Object.values(ps?.methods ?? {}).filter((v) => v === true).length,
        totalRevenue:    tx.totalAmount,
        txCount:         tx.count,
        pendingPayouts:  poMap[rid] ?? 0,
        settlementFreq:  ps?.settlement?.frequency ?? "weekly",
        frozen:          Boolean(r.paymentFrozen),
      };
    });

    return Response.json({
      success: true,
      restaurants: result,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("restaurant-payments GET error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
