"use client";

import CartItem from "@/components/pos/CartItem";
import EmptyState from "@/components/ui/EmptyState";
import { CreditCard, Trash2 } from "lucide-react";

export default function OrderSummary({
  cart,
  subtotal,
  tax,
  total,
  canPlaceOrder,
  onPlaceOrder,
  onClearCart,
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
}) {
  return (
    <aside className="flex h-full min-h-[520px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shadow-lg shadow-black/20">
      <div>
        <h2 className="text-base font-semibold text-zinc-100">Order Summary</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Review items and place order quickly.
        </p>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <EmptyState
            title="Cart is empty"
            description="Add items from the menu to begin."
          />
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => (
              <CartItem
                key={line.id}
                line={line}
                onInc={onInc}
                onDec={onDec}
                onRemove={onRemove}
                onSetQuantity={onSetQuantity}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm">
        <div className="flex items-center justify-between text-zinc-400">
          <span>Subtotal</span>
          <span className="font-medium text-zinc-200">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-zinc-400">
          <span>Tax (8%)</span>
          <span className="font-medium text-zinc-200">${tax.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-zinc-800 pt-2 text-base font-semibold text-zinc-100">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!canPlaceOrder}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CreditCard className="size-4" />
          Place Order
        </button>
        <button
          type="button"
          onClick={onClearCart}
          disabled={cart.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-all hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 className="size-4" />
          Clear Cart
        </button>
      </div>
    </aside>
  );
}
