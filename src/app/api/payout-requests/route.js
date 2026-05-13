/**
 * GET  /api/payout-requests  — list payout requests for a restaurant
 * POST /api/payout-requests  — create a new payout request
 */
import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(
  ["admin"],
  async ({ db, restaurantId }, request) => {
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 20;
    const skip  = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      db.collection("payout_requests")
        .find({ restaurantId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("payout_requests").countDocuments({ restaurantId }),
    ]);

    return Response.json({
      success: true,
      requests: requests.map((r) => ({
        id:          r._id.toString(),
        requestId:   r.requestId,
        amount:      r.amount,
        status:      r.status,
        note:        r.note ?? "",
        adminNote:   r.adminNote ?? "",
        createdAt:   r.createdAt,
        processedAt: r.processedAt ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }
);

export const POST = withTenant(["admin"], async ({ db, restaurantId, payload }, request) => {
  const body = await request.json();
  const amount = Number(body?.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ success: false, error: "Invalid amount." }, { status: 400 });
  }

  // Check minimum withdrawal
  const settingsDoc = await db.collection("restaurant_payment_settings").findOne({ restaurantId });
  const minAmount = Number(settingsDoc?.settlement?.minWithdrawalAmount ?? 100);
  if (amount < minAmount) {
    return Response.json(
      { success: false, error: `Minimum withdrawal amount is ${minAmount}.` },
      { status: 400 }
    );
  }

  // Check for pending request
  const pending = await db.collection("payout_requests").findOne({ restaurantId, status: "pending" });
  if (pending) {
    return Response.json(
      { success: false, error: "You already have a pending payout request." },
      { status: 400 }
    );
  }

  const requestId = `PAY-${Date.now()}`;
  await db.collection("payout_requests").insertOne({
    restaurantId,
    requestId,
    amount,
    status: "pending",
    note: String(body?.note ?? "").trim(),
    requestedBy: payload.id,
    createdAt: new Date(),
  });

  return Response.json({ success: true, requestId }, { status: 201 });
});
