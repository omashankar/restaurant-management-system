/**
 * GET  /api/payment-transactions  — paginated transaction history for a restaurant
 * POST /api/payment-transactions  — record a transaction (internal use)
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
    const method = searchParams.get("method") ?? "all";
    const from   = searchParams.get("from");
    const to     = searchParams.get("to");

    const filter = { restaurantId };
    if (status !== "all") filter.status = status;
    if (method !== "all") filter.paymentMethod = method;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to + "T23:59:59.999Z");
    }

    const [transactions, total, summary] = await Promise.all([
      db.collection("payment_transactions")
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("payment_transactions").countDocuments(filter),
      db.collection("payment_transactions").aggregate([
        { $match: { restaurantId, status: "paid" } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            count:       { $sum: 1 },
          },
        },
      ]).toArray(),
    ]);

    const s = summary[0] ?? { totalAmount: 0, count: 0 };

    return Response.json({
      success: true,
      transactions: transactions.map((t) => ({
        id:            t._id.toString(),
        transactionId: t.transactionId ?? t._id.toString(),
        orderId:       t.orderId ?? "—",
        customerName:  t.customerName ?? "—",
        paymentMethod: t.paymentMethod ?? "—",
        amount:        t.amount ?? 0,
        status:        t.status ?? "pending",
        gateway:       t.gateway ?? null,
        gatewayTxnId:  t.gatewayTxnId ?? null,
        createdAt:     t.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalAmount: s.totalAmount,
        paidCount:   s.count,
      },
    });
  }
);
