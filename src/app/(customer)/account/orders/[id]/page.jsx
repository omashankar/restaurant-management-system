"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { motion } from "framer-motion";
import { ArrowLeft, BellRing, Loader2, Receipt, CheckCircle2, Clock, Package, Truck, Star } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatWhen(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
  catch { return "—"; }
}

const TIMELINE_ICONS = { "✅": CheckCircle2, "⏳": Clock, "👨‍🍳": Package, "🚀": Truck, "🎉": Star };

export default function CustomerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { authUser, authLoading } = useCustomer();
  const { link } = useRestaurantSlug();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingAction, setRequestingAction] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !authUser) router.replace(link("/account/login"));
  }, [authLoading, authUser, router, link]);

  useEffect(() => {
    if (!id || !authUser) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/customer/orders/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) { if (!cancelled) setError(data?.error ?? "Could not load order."); return; }
        if (!cancelled) setOrder(data.order);
      } catch { if (!cancelled) setError("Something went wrong."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id, authUser]);

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
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-6 animate-spin text-[#FF6B35]" /></div>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      {/* Back */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href={link("/account/dashboard")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#6B7280] transition-colors hover:text-[#FF6B35]">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-[#FF6B35]" /></div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : order ? (
        <div className="space-y-4">

          {/* Order header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white shadow-sm">
            <div className="h-1.5 gradient-primary" />
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Order</p>
                  <h1 className="font-poppins text-xl font-bold text-[#111827]">{order.orderId}</h1>
                  <p className="mt-1 text-sm text-[#6B7280]">{formatWhen(order.createdAt)}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${order.chipClass ?? "bg-[#6B7280]/10 text-[#6B7280]"}`}>
                  <span>{order.statusEmoji}</span> {order.statusLabel}
                </span>
              </div>
              {order.statusKey === "cancelled" && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  This order was cancelled.
                </div>
              )}
            </div>
          </motion.div>

          {/* Items */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-poppins text-sm font-bold text-[#111827]">Items Ordered</h2>
            <ul className="divide-y divide-[#FFE4D6]">
              {order.items?.length ? order.items.map((line, i) => (
                <li key={`${line.id}-${i}`} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-[#111827]">{line.name}</p>
                    <p className="text-xs text-[#6B7280]">{formatCustomerMoney(line.price)} × {line.qty}</p>
                  </div>
                  <p className="shrink-0 font-semibold text-[#111827]">{formatCustomerMoney(line.lineTotal)}</p>
                </li>
              )) : <li className="py-2 text-sm text-[#6B7280]">No items recorded.</li>}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-[#FFE4D6] pt-4 text-sm">
              <div className="flex justify-between text-[#6B7280]"><dt>Subtotal</dt><dd className="font-medium text-[#111827]">{formatCustomerMoney(Number(order.subtotal))}</dd></div>
              <div className="flex justify-between text-[#6B7280]"><dt>Tax</dt><dd className="font-medium text-[#111827]">{formatCustomerMoney(Number(order.tax))}</dd></div>
              {Number(order.deliveryCharge ?? 0) > 0 && (
                <div className="flex justify-between text-[#6B7280]"><dt>Delivery</dt><dd className="font-medium text-[#111827]">{formatCustomerMoney(Number(order.deliveryCharge))}</dd></div>
              )}
              <div className="flex justify-between border-t border-[#FFE4D6] pt-2 font-poppins text-base font-bold text-[#111827]">
                <dt>Total</dt><dd className="text-[#FF6B35]">{formatCustomerMoney(Number(order.total))}</dd>
              </div>
            </dl>
          </motion.section>

          {/* Timeline */}
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-poppins text-sm font-bold text-[#111827]">Order Status</h2>
            <ol className="space-y-0">
              {order.timeline?.map((step, idx) => (
                <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                  {idx < order.timeline.length - 1 && (
                    <span className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-px ${step.state === "done" ? "gradient-primary" : "bg-[#FFE4D6]"}`} />
                  )}
                  <span className={`relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.state === "done" ? "gradient-primary text-white shadow-sm"
                    : step.state === "current" ? "border-2 border-[#FF6B35] bg-white text-[#FF6B35]"
                    : step.state === "bad" ? "bg-red-100 text-red-600"
                    : "bg-[#FFF8F3] text-[#6B7280]"
                  }`}>
                    {step.state === "done" ? "✓" : step.emoji}
                  </span>
                  <div>
                    <p className="font-poppins text-sm font-semibold text-[#111827]">{step.title}</p>
                    <p className="text-xs text-[#6B7280]">
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
              className="rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm">
              <h2 className="font-poppins text-sm font-bold text-[#111827]">Dine-In Actions</h2>
              <p className="mt-0.5 text-xs text-[#6B7280]">Table {order.tableNumber || "—"} · Request support from your phone</p>
              {actionSuccess && (
                <div className="mt-3 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/8 px-3 py-2 text-xs font-medium text-[#15803D]">
                  ✅ {actionSuccess}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <motion.button whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => submitDineInAction("call_waiter")}
                  disabled={requestingAction !== ""}
                  className="flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-60">
                  <BellRing className="size-4" />
                  {requestingAction === "call_waiter" ? "Sending..." : "Call Waiter"}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} type="button"
                  onClick={() => submitDineInAction("request_bill")}
                  disabled={requestingAction !== ""}
                  className="flex items-center gap-2 rounded-xl border border-[#FFE4D6] bg-white px-4 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-[#FF6B35]/30 disabled:opacity-60">
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
