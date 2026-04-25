"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { Bike, ConciergeBell, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}{required && <span className="ml-0.5 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3.5 py-3 text-sm text-zinc-100 outline-none transition-all focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15 placeholder:text-zinc-600";

export default function CheckoutPage() {
  const { cart, orderType, customer, updateCustomer, showToast, setOrderTypeModalOpen } = useCustomer();
  const { setOrderRows, setKitchenQueue } = useModuleData();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { lines, subtotal, clearCart } = cart;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  // Redirect to menu if cart is empty — must be in useEffect, not during render
  useEffect(() => {
    if (lines.length === 0) {
      router.replace("/order/menu");
    }
  }, [lines.length, router]);

  if (!orderType) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="text-zinc-300">Please select an order type first.</p>
        <button
          type="button"
          onClick={() => setOrderTypeModalOpen(true)}
          className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
        >
          Select Order Type
        </button>
      </div>
    );
  }

  if (lines.length === 0) return null;

  const placeOrder = async () => {
    if (!customer.name.trim() || !customer.phone.trim()) {
      showToast("Name and phone are required.", "error"); return;
    }
    if (orderType === "delivery" && !customer.address.trim()) {
      showToast("Delivery address is required.", "error"); return;
    }
    if (orderType === "dine-in" && !customer.tableNumber.trim()) {
      showToast("Table number is required.", "error"); return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const orderId = `ORD-C-${Date.now()}`;
    const now = new Date();
    const itemsSummary = lines.map((l) => `${l.name} ×${l.qty}`).join(", ");

    // Save to shared orderRows (visible in admin Orders page)
    const newOrder = {
      id: orderId,
      source: "customer",
      customer: customer.name.trim(),
      phone: customer.phone.trim(),
      type: orderType,
      table: orderType === "dine-in" ? customer.tableNumber.trim() : "—",
      address: orderType === "delivery" ? customer.address.trim() : "",
      amount: total,
      status: "new",
      items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      itemCount: lines.reduce((s, l) => s + l.qty, 0),
      time: "Just now",
      createdAt: now.toISOString(),
    };
    setOrderRows((prev) => [newOrder, ...prev]);

    // Push to kitchen queue
    const kitchenTicket = {
      id: `K-${orderId}`,
      orderId,
      table: newOrder.table,
      orderType,
      customer: customer.name.trim(),
      placedAt: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      elapsedMin: 0,
      status: "new",
      items: lines.map((l) => ({ name: l.name, qty: l.qty })),
    };
    setKitchenQueue((prev) => [kitchenTicket, ...prev]);

    clearCart();
    setLoading(false);
    router.push(`/order/success?id=${orderId}`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <Link href="/order/cart" className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-300">← Cart</Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-2xl font-bold text-zinc-50">Checkout</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Form ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Order type */}
          <div className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              {TypeIcon && <TypeIcon className="size-4 text-emerald-400" />}
              <span className="text-sm font-medium text-zinc-200">{TYPE_LABEL[orderType]}</span>
            </div>
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="cursor-pointer rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400"
            >
              Change
            </button>
          </div>

          {/* Customer details */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-zinc-400">Your Details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input value={customer.name} onChange={(e) => updateCustomer({ name: e.target.value })} placeholder="Your name" className={inputCls} />
              </Field>
              <Field label="Phone" required>
                <input value={customer.phone} onChange={(e) => updateCustomer({ phone: e.target.value })} placeholder="+1 555 000 0000" className={inputCls} />
              </Field>
              <Field label="Email" >
                <input type="email" value={customer.email} onChange={(e) => updateCustomer({ email: e.target.value })} placeholder="you@example.com" className={inputCls} />
              </Field>
              {orderType === "dine-in" && (
                <Field label="Table Number" required>
                  <input value={customer.tableNumber} onChange={(e) => updateCustomer({ tableNumber: e.target.value })} placeholder="e.g. T04" className={inputCls} />
                </Field>
              )}
              {orderType === "delivery" && (
                <div className="sm:col-span-2">
                  <Field label="Delivery Address" required>
                    <textarea rows={2} value={customer.address} onChange={(e) => updateCustomer({ address: e.target.value })} placeholder="Full delivery address" className={`${inputCls} resize-none`} />
                  </Field>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Order summary ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Order Summary</h2>
            <ul className="space-y-2.5">
              {lines.map((l) => (
                <li key={l.id} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-zinc-400">{l.qty}× <span className="text-zinc-200">{l.name}</span></span>
                  <span className="shrink-0 font-medium text-zinc-200">${(l.price * l.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm">
              <div className="flex justify-between text-zinc-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-zinc-400"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between pt-1 text-base font-bold text-zinc-100">
                <span>Total</span><span className="text-emerald-400">${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={placeOrder}
              disabled={loading}
              className="cursor-pointer mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="size-4 animate-spin" /> Placing Order…</>
                : `Place Order · $${total.toFixed(2)}`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
