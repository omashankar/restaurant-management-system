"use client";

import { useCustomer } from "@/context/CustomerContext";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { Bike, Clock, ConciergeBell, Minus, Plus, ShoppingCart, Store, Trash2 } from "lucide-react";
import Link from "next/link";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };

function typeIconColor(type) {
  if (type === "dine-in")  return "text-emerald-600";
  if (type === "takeaway") return "text-indigo-600";
  if (type === "delivery") return "text-sky-600";
  return "text-zinc-600";
}

export default function CartPage() {
  const { cart, orderType, setOrderTypeModalOpen } = useCustomer();
  const { lines, removeItem, setQty, subtotal, maxPrepTime } = cart;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500">
          <ShoppingCart className="size-8" />
        </span>
        <div>
          <p className="text-lg font-semibold text-zinc-900">Your cart is empty</p>
          <p className="mt-1 text-sm text-zinc-600">Add items from the menu to get started.</p>
        </div>
        <Link
          href="/order/menu"
          className="cursor-pointer rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white/85 px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Your Cart</h1>
        <p className="mt-1 text-xs text-zinc-600">Review items and continue to secure checkout.</p>
      </div>

      {/* Order type row */}
      <div className="mb-6 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-2.5">
          {TypeIcon && <TypeIcon className={`size-4 ${typeIconColor(orderType)}`} />}
          <span className="text-sm font-medium text-zinc-900">
            {orderType ? TYPE_LABEL[orderType] : "No order type selected"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOrderTypeModalOpen(true)}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-emerald-500/40 hover:text-emerald-700"
        >
          Change
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.id} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            {line.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={line.image} alt={line.name} className="size-16 shrink-0 rounded-xl object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{line.name}</p>
              <p className="mt-0.5 text-xs text-emerald-700">{formatCustomerMoney(line.price)} each</p>
            </div>
            {/* Qty controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1)}
                className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 transition-colors hover:border-red-500/40 hover:bg-red-50 hover:text-red-500"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-zinc-900">{line.qty}</span>
              <button
                type="button"
                onClick={() => setQty(line.id, line.qty + 1)}
                className="cursor-pointer flex size-8 items-center justify-center rounded-lg border border-zinc-300 text-zinc-600 transition-colors hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <p className="w-16 shrink-0 text-right text-sm font-bold text-zinc-900">
              {formatCustomerMoney(line.price * line.qty)}
            </p>
            <button
              type="button"
              onClick={() => removeItem(line.id)}
              className="cursor-pointer shrink-0 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-500"
              aria-label="Remove"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Est. prep time */}
      {maxPrepTime > 0 && (
        <div className="mt-5 flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <Clock className="size-4 shrink-0" />
          Estimated preparation time: ~{maxPrepTime} min
        </div>
      )}

      {/* Totals */}
      <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span><span className="text-zinc-900">{formatCustomerMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Tax (8%)</span><span className="text-zinc-900">{formatCustomerMoney(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-900">
            <span>Total</span><span className="text-emerald-700">{formatCustomerMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 space-y-3">
        <Link
          href="/order/checkout"
          className="cursor-pointer flex w-full items-center justify-center rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
        >
          Proceed to Checkout → {formatCustomerMoney(total)}
        </Link>
        <Link
          href="/order/menu"
          className="cursor-pointer flex w-full items-center justify-center rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900"
        >
          ← Continue Shopping
        </Link>
      </div>
    </div>
  );
}
