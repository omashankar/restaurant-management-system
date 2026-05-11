"use client";

import { useCustomer } from "@/context/CustomerContext";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { ArrowLeft, BellRing, Loader2, Receipt } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export default function CustomerOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { authUser, authLoading } = useCustomer();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingAction, setRequestingAction] = useState("");

  useEffect(() => {
    if (!authLoading && !authUser) {
      router.replace("/account/login");
    }
  }, [authLoading, authUser, router]);

  useEffect(() => {
    if (!id || !authUser) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/customer/orders/${id}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          if (!cancelled) setError(data?.error ?? "Could not load order.");
          return;
        }
        if (!cancelled) setOrder(data.order);
      } catch {
        if (!cancelled) setError("Something went wrong.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, authUser]);

  const submitDineInAction = async (action) => {
    if (!order?.tableNumber) {
      setError("Table number not found for this order.");
      return;
    }
    setRequestingAction(action);
    try {
      const res = await fetch("/api/customer/dine-in-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          tableNumber: order.tableNumber,
          orderId: order.orderId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Request failed.");
        return;
      }
      setError("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setRequestingAction("");
    }
  };

  if (authLoading || (!authUser && !authLoading)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-emerald-600" aria-hidden />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      <Link
        href="/account/dashboard#orders"
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to orders
      </Link>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-emerald-600" aria-hidden />
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : order ? (
        <div className="space-y-6">
          <header className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Order</p>
                <h1 className="text-xl font-bold text-zinc-900">{order.orderId}</h1>
                <p className="mt-1 text-sm text-zinc-600">{formatWhen(order.createdAt)}</p>
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${order.chipClass}`}
              >
                <span aria-hidden>{order.statusEmoji}</span>
                {order.statusLabel}
              </span>
            </div>
            {order.statusKey === "cancelled" ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 ring-1 ring-red-200/80">
                This order was cancelled.
              </p>
            ) : null}
          </header>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900">Items</h2>
            <ul className="mt-3 divide-y divide-zinc-100">
              {order.items?.length ? (
                order.items.map((line, i) => (
                  <li key={`${line.id}-${i}`} className="flex justify-between gap-3 py-3 first:pt-0">
                    <div>
                      <p className="font-medium text-zinc-900">{line.name}</p>
                      <p className="text-xs text-zinc-500">
                        {formatCustomerMoney(line.price)} × {line.qty}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-zinc-900">{formatCustomerMoney(line.lineTotal)}</p>
                  </li>
                ))
              ) : (
                <li className="py-2 text-sm text-zinc-500">No line items recorded.</li>
              )}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between text-zinc-600">
                <dt>Subtotal</dt>
                <dd className="font-medium text-zinc-900">{formatCustomerMoney(Number(order.subtotal))}</dd>
              </div>
              <div className="flex justify-between text-zinc-600">
                <dt>Tax</dt>
                <dd className="font-medium text-zinc-900">{formatCustomerMoney(Number(order.tax))}</dd>
              </div>
              {Number(order.deliveryCharge ?? 0) > 0 ? (
                <div className="flex justify-between text-zinc-600">
                  <dt>Delivery</dt>
                  <dd className="font-medium text-zinc-900">{formatCustomerMoney(Number(order.deliveryCharge))}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-100 pt-2 text-base font-bold text-zinc-900">
                <dt>Total</dt>
                <dd>{formatCustomerMoney(Number(order.total))}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900">Status</h2>
            <ol className="mt-4 space-y-0">
              {order.timeline?.map((step, idx) => (
                <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                  {idx < order.timeline.length - 1 ? (
                    <span
                      className={`absolute left-[11px] top-6 h-[calc(100%-8px)] w-px ${
                        step.state === "done" ? "bg-emerald-400" : "bg-zinc-200"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      step.state === "done"
                        ? "bg-emerald-500 text-zinc-950"
                        : step.state === "current"
                          ? "bg-emerald-500/20 ring-2 ring-emerald-500/40"
                          : step.state === "bad"
                            ? "bg-red-100 text-red-800"
                            : "bg-zinc-100 text-zinc-400"
                    }`}
                    aria-hidden
                  >
                    {step.state === "done" ? "✓" : step.emoji}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
                    <p className="text-xs text-zinc-500">
                      {step.state === "current"
                        ? "In progress"
                        : step.state === "done"
                          ? "Completed"
                          : step.state === "bad"
                            ? "Stopped here"
                            : "Waiting"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {order.orderType === "dine-in" ? (
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900">Dine-in actions</h2>
              <p className="mt-1 text-xs text-zinc-600">Table {order.tableNumber || "—"} · Request support from your phone.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => submitDineInAction("call_waiter")}
                  disabled={requestingAction !== ""}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-60"
                >
                  <BellRing className="size-4" />
                  {requestingAction === "call_waiter" ? "Sending..." : "Call Waiter"}
                </button>
                <button
                  type="button"
                  onClick={() => submitDineInAction("request_bill")}
                  disabled={requestingAction !== ""}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-400 disabled:opacity-60"
                >
                  <Receipt className="size-4" />
                  {requestingAction === "request_bill" ? "Sending..." : "Request Bill"}
                </button>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
