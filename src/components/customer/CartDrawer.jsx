"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import Link from "next/link";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen } = useCustomer();
  const { link } = useRestaurantSlug();
  const { lines, removeItem, setQty, subtotal, itemCount } = cart;

  return (
    <>
      {cartOpen && (
        <button
          type="button"
          aria-label="Close cart"
          className="fixed inset-0 z-40 cursor-pointer bg-black/40 backdrop-blur-[2px] transition-opacity"
          onClick={() => setCartOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-zinc-200/90 bg-white shadow-2xl shadow-zinc-900/10 transition-transform duration-300 ease-out ${
          cartOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!cartOpen}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5 text-emerald-600" aria-hidden />
            <h2 className="text-base font-bold tracking-tight text-zinc-900">Your cart</h2>
            {itemCount > 0 && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-bold text-zinc-950 tabular-nums">
                {itemCount}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className={`cursor-pointer rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${focusRing}`}
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="flex size-16 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 text-zinc-400">
                <ShoppingCart className="size-8" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-zinc-800">Cart is empty</p>
              <p className="max-w-[220px] text-xs leading-relaxed text-zinc-500">Add dishes from the menu — they appear here.</p>
              <Link
                href={link("/order/menu")}
                onClick={() => setCartOpen(false)}
                className={`mt-1 cursor-pointer rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-600/10 transition-colors hover:bg-emerald-400 ${focusRing}`}
              >
                Browse menu
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => (
                <li key={line.id} className="flex gap-3 rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-3 ring-1 ring-zinc-100">
                  <SafeDishImage
                    src={line.image}
                    alt=""
                    className="size-14 shrink-0 rounded-lg object-cover"
                    iconClassName="size-7 text-emerald-600/35"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug text-zinc-900">{line.name}</p>
                      <button
                        type="button"
                        onClick={() => removeItem(line.id)}
                        className={`shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 ${focusRing}`}
                        aria-label={`Remove ${line.name}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="text-xs font-bold tabular-nums text-emerald-700">{formatCustomerMoney(line.price * line.qty)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => (line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1))}
                        className={`flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-red-300 hover:bg-red-50 ${focusRing}`}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3.5" aria-hidden />
                      </button>
                      <span className="min-w-[1.75rem] text-center text-sm font-bold tabular-nums text-zinc-900">{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(line.id, line.qty + 1)}
                        className={`flex size-8 cursor-pointer items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-emerald-400 hover:bg-emerald-50 ${focusRing}`}
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="space-y-3 border-t border-zinc-200 bg-white px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-bold tabular-nums text-zinc-900">{formatCustomerMoney(subtotal)}</span>
            </div>
            {cart.maxPrepTime > 0 && (
              <p className="text-xs text-zinc-500">Est. prep: ~{cart.maxPrepTime} min</p>
            )}
            <Link
              href={link("/order/cart")}
              onClick={() => setCartOpen(false)}
              className={`block w-full cursor-pointer rounded-xl bg-emerald-500 py-3 text-center text-sm font-bold text-zinc-950 shadow-md shadow-emerald-600/10 transition-colors hover:bg-emerald-400 ${focusRing}`}
            >
              View cart & checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
