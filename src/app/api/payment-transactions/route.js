/**
 * GET  /api/payment-transactions  — paginated payment history for a restaurant
 * Includes SaaS subscription payments (payments) and order gateway rows (payment_transactions).
 */
import { withTenant } from "@/lib/tenantDb";

function mapSubscriptionPayment(p) {
  return {
    id: p._id.toString(),
    transactionId: p.invoiceId ?? p._id.toString(),
    orderId: p.planName ? `Plan: ${p.planName}` : p.plan ?? "Subscription",
    customerName: "Subscription",
    paymentMethod: p.method ?? "—",
    amount: p.amount ?? 0,
    status: p.status ?? "pending",
    gateway: p.gatewayProvider ?? null,
    gatewayTxnId: p.gatewayPaymentId ?? null,
    createdAt: p.createdAt,
    source: "subscription",
  };
}

function mapOrderTransaction(t) {
  return {
    id: t._id.toString(),
    transactionId: t.transactionId ?? t._id.toString(),
    orderId: t.orderId ?? "—",
    customerName: t.customerName ?? "—",
    paymentMethod: t.paymentMethod ?? "—",
    amount: t.amount ?? 0,
    status: t.status ?? "pending",
    gateway: t.gateway ?? null,
    gatewayTxnId: t.gatewayTxnId ?? null,
    createdAt: t.createdAt,
    source: "order",
  };
}

function matchesMethod(row, method) {
  if (method === "all") return true;
  const key = String(row.paymentMethod ?? "").toLowerCase();
  return key === method.toLowerCase();
}

export const GET = withTenant(
  ["admin", "manager"],
  async ({ db, restaurantId }, request) => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") ?? "all";
    const method = searchParams.get("method") ?? "all";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const dateFilter = {};
    if (from || to) {
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to + "T23:59:59.999Z");
    }

    const paymentsFilter = { restaurantId };
    if (status !== "all") paymentsFilter.status = status;
    if (Object.keys(dateFilter).length) paymentsFilter.createdAt = dateFilter;

    const txFilter = { restaurantId };
    if (status !== "all") txFilter.status = status;
    if (Object.keys(dateFilter).length) txFilter.createdAt = dateFilter;

    const [subscriptionRows, orderRows] = await Promise.all([
      db.collection("payments").find(paymentsFilter).sort({ createdAt: -1 }).limit(500).toArray(),
      db.collection("payment_transactions").find(txFilter).sort({ createdAt: -1 }).limit(500).toArray(),
    ]);

    let merged = [
      ...subscriptionRows.map(mapSubscriptionPayment),
      ...orderRows.map(mapOrderTransaction),
    ].filter((row) => matchesMethod(row, method));

    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = merged.length;
    const transactions = merged.slice(skip, skip + limit).map(({ source, ...row }) => row);

    const paidRows = merged.filter((r) => r.status === "paid");
    const totalAmount = paidRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    return Response.json({
      success: true,
      transactions,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      summary: {
        totalAmount,
        paidCount: paidRows.length,
      },
    });
  }
);
