/**
 * GET  /api/refund-requests  — list refund requests for a restaurant
 * POST /api/refund-requests  — create a refund request
 */
import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, restaurantId }, request) => {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit  = 20;
    const skip   = (page - 1) * limit;
    const status = searchParams.get("status") ?? "all";

    const filter = { restaurantId };
    if (status !== "all") filter.status = status;

    const [requests, total] = await Promise.all([
      db.collection("refund_requests")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("refund_requests").countDocuments(filter),
    ]);

    return Response.json({
      success: true,
      requests: requests.map((r) => ({
        id:            r._id.toString(),
        refundId:      r.refundId,
        orderId:       r.orderId,
        customerName:  r.customerName ?? "—",
        originalAmount:r.originalAmount ?? 0,
        refundAmount:  r.refundAmount ?? 0,
        type:          r.type ?? "full",
        reason:        r.reason ?? "",
        status:        r.status ?? "pending",
        adminNote:     r.adminNote ?? "",
        createdAt:     r.createdAt,
        processedAt:   r.processedAt ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  }
);

export const POST = withTenant(["admin", "manager"], async ({ db, restaurantId, payload }, request) => {
  const body = await request.json();
  const { orderId, refundAmount, type, reason } = body;

  if (!orderId) {
    return Response.json({ success: false, error: "orderId is required." }, { status: 400 });
  }

  const refundAmt = Number(refundAmount);
  if (!Number.isFinite(refundAmt) || refundAmt <= 0) {
    return Response.json({ success: false, error: "Invalid refund amount." }, { status: 400 });
  }

  if (!["full", "partial"].includes(type)) {
    return Response.json({ success: false, error: "type must be full or partial." }, { status: 400 });
  }

  // Find the order
  const order = await db.collection("orders").findOne({ orderId, restaurantId });
  if (!order) {
    return Response.json({ success: false, error: "Order not found." }, { status: 404 });
  }

  if (order.payment?.refundStatus === "refunded") {
    return Response.json({ success: false, error: "Order already refunded." }, { status: 400 });
  }

  const refundId = `REF-${Date.now()}`;
  await db.collection("refund_requests").insertOne({
    restaurantId,
    refundId,
    orderId,
    customerName: order.customer ?? order.customerInfo?.name ?? "—",
    originalAmount: order.payment?.total ?? order.total ?? 0,
    refundAmount: refundAmt,
    type,
    reason: String(reason ?? "").trim(),
    status: "pending",
    requestedBy: payload.id,
    createdAt: new Date(),
  });

  return Response.json({ success: true, refundId }, { status: 201 });
});
