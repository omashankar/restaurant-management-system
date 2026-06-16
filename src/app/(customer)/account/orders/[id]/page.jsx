"use client";

import CustomerAccountLayout from "@/components/customer/CustomerAccountLayout";
import { useCustomer } from "@/context/CustomerContext";
import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { timelineStepCaption } from "@/lib/customerOrderSerialize";
import { orderStatusBadgeClass } from "@/lib/customerStatusStyles";
import { customerClasses } from "@/lib/customerTheme";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BellRing,
  Bike,
  ConciergeBell,
  Loader2,
  MapPin,
  Phone,
  Receipt,
  RefreshCw,
  RotateCcw,
  Store,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ORDER_TYPE_ICON = {
  "dine-in": Store,
  takeaway: ConciergeBell,
  delivery: Bike,
};

function MetaRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-customer-primary" aria-hidden />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-customer-muted">{label}</p>
        <p className="break-words text-customer-text">{value}</p>
      </div>
    </div>
  );
}

export default function CustomerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { authUser, authLoading, cart, showToast } = useCustomer();
  const { formatDateTime } = useCustomerLocale();
  const { link } = useRestaurantSlug();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState({ type: "", message: "" });
  const [requestingAction, setRequestingAction] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const orderActiveRef = useRef(false);
  orderActiveRef.current = Boolean(order?.isActive);

  useEffect(() => {
    if (!authLoading && !authUser) router.replace(link("/account/login"));
  }, [authLoading, authUser, router, link]);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!id || !authUser) return;
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const res = await fetch(`/api/customer/orders/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          if (!silent) setError(data?.error ?? "Could not load order.");
          return;
        }
        setOrder(data.order);
      } catch {
        if (!silent) setError("Something went wrong.");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [id, authUser]
  );

  useEffect(() => {
    loadOrder(false);
  }, [loadOrder]);

  useLiveRefresh(() => {
    if (orderActiveRef.current) loadOrder(true);
  }, { intervalMs: 15000, eventName: null });

  const cancelOrder = async () => {
    setCancelling(true);
    setBanner({ type: "", message: "" });
    try {
      const res = await fetch(`/api/customer/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setBanner({ type: "error", message: data?.error ?? "Could not cancel." });
        return;
      }
      setBanner({ type: "success", message: data.message ?? "Order cancelled." });
      await loadOrder(true);
    } catch {
      setBanner({ type: "error", message: "Network error." });
    } finally {
      setCancelling(false);
    }
  };

  const reorder = async () => {
    setReordering(true);
    try {
      const res = await fetch(`/api/customer/orders/${id}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefillOnly: true }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        showToast(data?.error ?? "Could not reorder.", "error");
        return;
      }
      for (const item of data.items ?? []) {
        cart.addItem({ ...item, image: null, itemType: null, prepTime: null });
      }
      showToast("Items added to cart.");
      router.push(link("/order/cart"));
    } catch {
      showToast("Network error.", "error");
    } finally {
      setReordering(false);
    }
  };

  const submitDineInAction = async (action) => {
    if (!order?.tableNumber) {
      setBanner({ type: "error", message: "Table number not found." });
      return;
    }
    setRequestingAction(action);
    setBanner({ type: "", message: "" });
    try {
      const res = await fetch("/api/customer/dine-in-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tableNumber: order.tableNumber, orderId: order.orderId }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setBanner({ type: "error", message: data?.error ?? "Request failed." });
        return;
      }
      setBanner({ type: "success", message: data.message ?? "Request sent!" });
    } catch {
      setBanner({ type: "error", message: "Network error." });
    } finally {
      setRequestingAction("");
    }
  };

  if (authLoading || (!authUser && !authLoading)) {
    return (
      <div className="ct-page-shell flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-customer-primary" />
      </div>
    );
  }

  const TypeIcon = ORDER_TYPE_ICON[order?.orderType] ?? Store;

  return (
    <CustomerAccountLayout
      activeSection="orders"
      pageTitle={order?.orderId ? `Order ${order.orderId}` : "Order details"}
      pageSubtitle={
        order?.createdAt
          ? `${order.orderTypeLabel} · ${formatDateTime(order.createdAt)}`
          : "Track status, payment, and items"
      }
    >
      <Link
        href={link("/account/dashboard?section=orders")}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-customer-muted transition-colors hover:text-customer-primary"
      >
        <ArrowLeft className="size-4" /> Back to My Orders
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-customer-primary" />
        </div>
      ) : error ? (
        <div className="ct-alert ct-alert-error text-sm">{error}</div>
      ) : order ? (
        <div className="space-y-4">
          {banner.message ? (
            <div
              className={
                banner.type === "success" ? customerClasses.alertSuccess : customerClasses.alertError
              }
            >
              {banner.message}
            </div>
          ) : null}

          {order.isActive ? (
            <div className="flex items-center gap-2 rounded-xl border border-customer-border bg-[var(--customer-card)] px-3 py-2 text-xs text-customer-muted">
              <RefreshCw className="size-3.5 shrink-0 text-customer-primary" aria-hidden />
              Status updates automatically every 15 seconds
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-5 lg:items-start">
            <div className="space-y-4 lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden ct-surface-card rounded-2xl"
              >
                <div className="h-1 gradient-primary" />
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-customer-primary/10 text-customer-primary">
                        <TypeIcon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-customer-muted">
                          {order.orderTypeLabel}
                        </p>
                        <p className="break-all font-poppins text-lg font-bold text-customer-text">
                          {order.orderId}
                        </p>
                        <p className="mt-0.5 text-sm text-customer-muted">{formatDateTime(order.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`${orderStatusBadgeClass(order.statusKey)} gap-1.5 px-3 py-1.5 text-xs`}>
                      <span aria-hidden>{order.statusEmoji}</span>
                      <span>{order.statusLabel}</span>
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <MetaRow icon={UserRound} label="Customer" value={order.customerName} />
                    <MetaRow icon={Phone} label="Phone" value={order.customerPhone} />
                    {order.orderType === "dine-in" ? (
                      <MetaRow icon={Store} label="Table" value={order.tableNumber ? `Table ${order.tableNumber}` : ""} />
                    ) : null}
                    {order.orderType === "delivery" ? (
                      <MetaRow icon={MapPin} label="Delivery address" value={order.deliveryAddress} />
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-customer-border pt-4">
                    <span className="rounded-full border border-customer-border bg-[var(--customer-cream)] px-3 py-1 text-xs font-medium text-customer-text">
                      {order.paymentMethodLabel}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      {order.paymentStatusLabel}
                    </span>
                    <span className="rounded-full bg-customer-primary/10 px-3 py-1 text-xs font-semibold text-customer-primary">
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </span>
                  </div>

                  {order.notes ? (
                    <div className="rounded-xl border border-customer-border bg-[var(--customer-cream)]/50 px-3 py-2.5 text-sm text-customer-text">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-customer-muted">Order note</p>
                      <p className="mt-1 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {order.canReorder ? (
                      <button
                        type="button"
                        onClick={reorder}
                        disabled={reordering}
                        className={`${customerClasses.btnPrimary} gap-2 px-4 py-2.5 text-sm disabled:opacity-60`}
                      >
                        <RotateCcw className="size-4" />
                        {reordering ? "Adding…" : "Reorder"}
                      </button>
                    ) : null}
                    {order.canCancel ? (
                      <button
                        type="button"
                        onClick={cancelOrder}
                        disabled={cancelling}
                        className={`rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-60 dark:text-red-400`}
                      >
                        {cancelling ? "Cancelling…" : "Cancel order"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>

              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="ct-surface-card rounded-2xl p-5 sm:p-6"
              >
                <h2 className="mb-3 font-poppins text-sm font-bold text-customer-text">Items ordered</h2>
                <ul className="divide-y divide-customer-border">
                  {order.items?.length ? (
                    order.items.map((line, i) => (
                      <li key={`${line.id}-${i}`} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-customer-text">{line.name}</p>
                            <p className="text-xs text-customer-muted">
                              {formatCustomerMoney(line.price)} × {line.qty}
                            </p>
                            {line.note ? (
                              <p className="mt-1 text-xs text-customer-muted">Note: {line.note}</p>
                            ) : null}
                          </div>
                          <p className="shrink-0 font-semibold tabular-nums text-customer-text">
                            {formatCustomerMoney(line.lineTotal)}
                          </p>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li className="py-2 text-sm text-customer-muted">No items recorded.</li>
                  )}
                </ul>

                <dl className="mt-4 space-y-2 border-t border-customer-border pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3 text-customer-muted">
                    <dt>Subtotal</dt>
                    <dd className="font-medium tabular-nums text-customer-text">
                      {formatCustomerMoney(order.subtotal)}
                    </dd>
                  </div>
                  {order.couponDiscount > 0 ? (
                    <div className="flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300">
                      <dt>Coupon</dt>
                      <dd className="font-medium tabular-nums">−{formatCustomerMoney(order.couponDiscount)}</dd>
                    </div>
                  ) : null}
                  {order.pointsDiscount > 0 ? (
                    <div className="flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300">
                      <dt>Points used</dt>
                      <dd className="font-medium tabular-nums">−{formatCustomerMoney(order.pointsDiscount)}</dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 text-customer-muted">
                    <dt>Tax{order.taxPercent > 0 ? ` (${order.taxPercent}%)` : ""}</dt>
                    <dd className="font-medium tabular-nums text-customer-text">{formatCustomerMoney(order.tax)}</dd>
                  </div>
                  {order.serviceCharge > 0 ? (
                    <div className="flex items-center justify-between gap-3 text-customer-muted">
                      <dt>Service{order.serviceChargePercent > 0 ? ` (${order.serviceChargePercent}%)` : ""}</dt>
                      <dd className="font-medium tabular-nums text-customer-text">
                        {formatCustomerMoney(order.serviceCharge)}
                      </dd>
                    </div>
                  ) : null}
                  {order.deliveryCharge > 0 ? (
                    <div className="flex items-center justify-between gap-3 text-customer-muted">
                      <dt>Delivery</dt>
                      <dd className="font-medium tabular-nums text-customer-text">
                        {formatCustomerMoney(order.deliveryCharge)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-3 border-t border-customer-border pt-3 font-poppins text-base font-bold text-customer-text">
                    <dt>Total</dt>
                    <dd className="tabular-nums text-customer-primary">{formatCustomerMoney(order.total)}</dd>
                  </div>
                </dl>
              </motion.section>
            </div>

            <div className="space-y-4 lg:col-span-2">
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="ct-surface-card rounded-2xl p-5 sm:p-6"
              >
                <h2 className="mb-4 font-poppins text-sm font-bold text-customer-text">Order status</h2>
                <ol className="space-y-0">
                  {order.timeline?.map((step, idx) => (
                    <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                      {idx < order.timeline.length - 1 ? (
                        <span
                          className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-px ${
                            step.state === "done" ? "ct-timeline-line--done" : "ct-timeline-line"
                          }`}
                        />
                      ) : null}
                      <span
                        className={`relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          step.state === "done"
                            ? "gradient-primary text-white"
                            : step.state === "current"
                              ? "border-2 border-customer-primary bg-[var(--customer-card)] text-customer-primary"
                              : step.state === "bad"
                                ? "ct-status-badge ct-status-cancelled"
                                : "bg-customer-cream text-customer-muted"
                        }`}
                      >
                        {step.state === "done" ? "✓" : step.emoji}
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="font-poppins text-sm font-semibold text-customer-text">{step.title}</p>
                        <p className="text-xs text-customer-muted">{timelineStepCaption(step.state)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </motion.section>

              {order.orderType === "dine-in" && order.statusKey !== "cancelled" && order.statusKey !== "completed" ? (
                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="ct-surface-card rounded-2xl p-5 sm:p-6"
                >
                  <h2 className="font-poppins text-sm font-bold text-customer-text">Dine-in help</h2>
                  <p className="mt-0.5 text-xs text-customer-muted">
                    Table {order.tableNumber || "—"} · Send a request to staff
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => submitDineInAction("call_waiter")}
                      disabled={requestingAction !== ""}
                      className={`${customerClasses.btnPrimary} gap-2 px-4 py-2.5 text-sm disabled:opacity-60`}
                    >
                      <BellRing className="size-4" />
                      {requestingAction === "call_waiter" ? "Sending…" : "Call waiter"}
                    </button>
                    <button
                      type="button"
                      onClick={() => submitDineInAction("request_bill")}
                      disabled={requestingAction !== ""}
                      className="flex items-center gap-2 rounded-xl border border-customer-border bg-[var(--customer-card)] px-4 py-2.5 text-sm font-semibold text-customer-text transition-colors hover:border-customer-primary/30 disabled:opacity-60"
                    >
                      <Receipt className="size-4" />
                      {requestingAction === "request_bill" ? "Sending…" : "Request bill"}
                    </button>
                  </div>
                </motion.section>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </CustomerAccountLayout>
  );
}
