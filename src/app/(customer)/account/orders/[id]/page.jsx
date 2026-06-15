"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { motion } from "framer-motion";
import { ArrowLeft, BellRing, Loader2, Receipt, CheckCircle2, Clock, Package, Truck, Star } from "lucide-react";
import Link from "next/link";
import { customerClasses } from "@/lib/customerTheme";
import { useParams, useRouter } from "next/navigation";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { useCallback, useEffect, useState } from "react";

const TIMELINE_ICONS = { "✅": CheckCircle2, "⏳": Clock, "👨‍🍳": Package, "🚀": Truck, "🎉": Star };

export default function CustomerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { authUser, authLoading } = useCustomer();
  const { formatDateTime } = useCustomerLocale();
  const { link } = useRestaurantSlug();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingAction, setRequestingAction] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !authUser) router.replace(link("/account/login"));
  }, [authLoading, authUser, router, link]);

  const loadOrder = useCallback(async (silent = false) => {
    if (!id || !authUser) return;
    if (!silent) { setLoading(true); setError(""); }
    try {
      const res = await fetch(`/api/customer/orders/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.success) { if (!silent) setError(data?.error ?? "Could not load order."); return; }
      setOrder(data.order);
    } catch { if (!silent) setError("Something went wrong."); }
    finally { if (!silent) setLoading(false); }
  }, [id, authUser]);

  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  useLiveRefresh(() => loadOrder(true), { intervalMs: 15000, eventName: null });

  const cancelOrder = async () => {
    try {
      const res = await fetch(`/api/customer/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.success) { setError(data?.error ?? "Could not cancel."); return; }
      setActionSuccess(data.message ?? "Order cancelled.");
      await loadOrder(true);
    } catch { setError("Network error."); }
  };

  const submitDineInAction = async (action) => {
    if (!order?.tableNumber) { setError("Table number not found."); return; }
    setRequestingAction(action);
    setActionSuccess("");
    try {
      const res = await fetch("/api/customer/dine-in-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tableNumber: order.tableNumber, orderId: order.orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) { setError(data?.error ?? "Request failed."); return; }
      setActionSuccess(data.message ?? "Request sent!");
      setError("");
    } catch { setError("Network error."); }
    finally { setRequestingAction(""); }
  };

  if (authLoading || (!authUser && !authLoading)) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-customer-primary" /></div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href={link("/account/dashboard?section=orders")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-customer-muted transition-colors hover:text-customer-primary">
          <ArrowLeft className="size-4" /> Back to My Orders
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-customer-primary" /></div>
      ) : error ? (
        <div className="ct-alert ct-alert-error text-sm">{error}</div>
      ) : order ? (
        <div className="space-y-4">

          {/* Order header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden ct-surface-card rounded-2xl">
            <div className="h-1.5 gradient-primary" />
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-customer-muted">Order</p>
                  <h1 className="font-poppins text-xl font-bold text-customer-text">{order.orderId}</h1>
                  <p className="mt-1 text-sm text-customer-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${order.chipClass ?? "bg-[#6B7280]/10 text-customer-muted"}`}>
                  <span>{order.statusEmoji}</span> {order.statusLabel}
                </span>
              </div>
              {order.statusKey === "cancelled" && (
                <div className={`mt-3 ${customerClasses.alertError} text-sm`}>
                  This order was cancelled.
                </div>
              )}
              {["new", "pending"].includes(order.statusKey) && (
                <button type="button" onClick={cancelOrder} className={`mt-3 text-sm font-semibold hover:underline ${customerClasses.textDanger}`}>
                  Cancel this order
                </button>
              )}
            </div>
          </motion.div>

          {/* Items */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="ct-surface-card rounded-2xl p-5">
            <h2 className="mb-3 font-poppins text-sm font-bold text-customer-text">Items Ordered</h2>
            <ul className="divide-y divide-customer-border">
              {order.items?.length ? order.items.map((line, i) => (
                <li key={`${line.id}-${i}`} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-customer-text">{line.name}</p>
                    <p className="text-xs text-customer-muted">{formatCustomerMoney(line.price)} × {line.qty}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-customer-text">{formatCustomerMoney(line.lineTotal)}</p>
                </li>
              )) : <li className="py-2 text-sm text-customer-muted">No items recorded.</li>}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-customer-border pt-4 text-sm">
              <div className="flex justify-between text-customer-muted"><dt>Subtotal</dt><dd className="font-medium text-customer-text">{formatCustomerMoney(Number(order.subtotal))}</dd></div>
              <div className="flex justify-between text-customer-muted"><dt>Tax</dt><dd className="font-medium text-customer-text">{formatCustomerMoney(Number(order.tax))}</dd></div>
              {Number(order.deliveryCharge ?? 0) > 0 && (
                <div className="flex justify-between text-customer-muted"><dt>Delivery</dt><dd className="font-medium text-customer-text">{formatCustomerMoney(Number(order.deliveryCharge))}</dd></div>
              )}
              <div className="flex justify-between border-t border-customer-border pt-2 font-poppins text-base font-bold text-customer-text">
                <dt>Total</dt><dd className="text-customer-primary">{formatCustomerMoney(Number(order.total))}</dd>
              </div>
            </dl>
          </motion.section>

          {/* Timeline */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="ct-surface-card rounded-2xl p-5">
            <h2 className="mb-4 font-poppins text-sm font-bold text-customer-text">Order Status</h2>
            <ol className="space-y-0">
              {order.timeline?.map((step, idx) => (
                <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                  {idx < order.timeline.length - 1 && (
                    <span className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-px ${step.state === "done" ? "ct-timeline-line--done" : "ct-timeline-line"}`} />
                  )}
                  <span className={`relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.state === "done" ? "gradient-primary text-white"
                    : step.state === "current" ? "border-2 border-customer-primary bg-[var(--customer-card)] text-customer-primary"
                    : step.state === "bad" ? "ct-status-badge ct-status-cancelled"
                    : "bg-customer-cream text-customer-muted"
                  }`}>
                    {step.state === "done" ? "✓" : step.emoji}
                  </span>
                  <div>
                    <p className="font-poppins text-sm font-semibold text-customer-text">{step.title}</p>
                    <p className="text-xs text-customer-muted">
                      {step.state === "current" ? "In progress" : step.state === "done" ? "Completed" : step.state === "bad" ? "Stopped" : "Waiting"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.section>

          {/* Dine-in actions */}
          {order.orderType === "dine-in" && (
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="ct-surface-card rounded-2xl p-5">
              <h2 className="font-poppins text-sm font-bold text-customer-text">Dine-In Actions</h2>
              <p className="mt-0.5 text-xs text-customer-muted">Table {order.tableNumber || "—"} · Request support from your phone</p>
              {actionSuccess && (
                <div className={`mt-3 ${customerClasses.alertSuccess} text-xs font-medium`}>
                  ✅ {actionSuccess}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <motion.button whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => submitDineInAction("call_waiter")}
                  disabled={requestingAction !== ""}
                  className={`${customerClasses.btnPrimary} gap-2 px-4 py-2.5 text-sm disabled:opacity-60`}>
                  <BellRing className="size-4" />
                  {requestingAction === "call_waiter" ? "Sending..." : "Call Waiter"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => submitDineInAction("request_bill")}
                  disabled={requestingAction !== ""}
                  className="flex items-center gap-2 rounded-xl border border-customer-border bg-[var(--customer-card)] px-4 py-2.5 text-sm font-semibold text-customer-text transition-colors hover:border-customer-primary/30 disabled:opacity-60">
                  <Receipt className="size-4" />
                  {requestingAction === "request_bill" ? "Sending..." : "Request Bill"}
                </motion.button>
              </div>
            </motion.section>
          )}

        </div>
      ) : null}
    </div>
  );
}
