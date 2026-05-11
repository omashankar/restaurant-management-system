"use client";

import { useCustomer } from "@/context/CustomerContext";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen } = useCustomer();
  const { lines, removeItem, setQty, subtotal, itemCount } = cart;

  return (
    <>
      {/* Backdrop */}
      {cartOpen && (
        <button
          type="button"
          aria-label="Close cart"
          className="cursor-pointer fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
          onClick={() => setCartOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-200 bg-white shadow-2xl transition-transform duration-300 ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-emerald-600" />
            <h2 className="text-base font-semibold text-zinc-900">Your Cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-zinc-950">
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
              <ShoppingCart className="size-12 text-zinc-400" />
              <p className="text-sm font-medium text-zinc-700">Your cart is empty</p>
              <p className="text-xs text-zinc-500">Add items from the menu to get started</p>
              <Link
                href="/order/menu"
                onClick={() => setCartOpen(false)}
                className="cursor-pointer mt-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
              >
                Browse Menu
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  {/* Image */}
                  {line.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={line.image} alt={line.name} className="size-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-2xl">
                      🍽️
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1.5">
                    <p className="text-sm font-semibold leading-tight text-zinc-900">{line.name}</p>
                    <p className="text-xs font-bold text-emerald-700">{formatCustomerMoney(line.price * line.qty)}</p>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1)}
                        className="cursor-pointer flex size-6 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-semibold text-zinc-900">
                        {line.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(line.id, line.qty + 1)}
                        className="cursor-pointer flex size-6 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-900"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    className="cursor-pointer self-start rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-red-500"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="border-t border-zinc-200 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-bold text-zinc-900">{formatCustomerMoney(subtotal)}</span>
            </div>
            {cart.maxPrepTime > 0 && (
              <p className="text-xs text-zinc-600">Est. prep time: ~{cart.maxPrepTime} min</p>
            )}
            <Link
              href="/order/cart"
              onClick={() => setCartOpen(false)}
              className="cursor-pointer block w-full rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              View Cart & Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
