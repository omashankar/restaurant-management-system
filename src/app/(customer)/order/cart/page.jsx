"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { Bike, Clock, ConciergeBell, Minus, Plus, ShoppingCart, Store, Trash2 } from "lucide-react";
import Link from "next/link";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

function typeIconColor(type) {
  if (type === "dine-in") return "text-emerald-600";
  if (type === "takeaway") return "text-indigo-600";
  if (type === "delivery") return "text-sky-600";
  return "text-zinc-600";
}

export default function CartPage() {
  const { cart, orderType, setOrderTypeModalOpen } = useCustomer();
  const { link } = useRestaurantSlug();
  const { lines, removeItem, setQty, subtotal, maxPrepTime } = cart;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <span className="flex size-20 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-100">
          <ShoppingCart className="size-9" aria-hidden />
        </span>
        <div className="max-w-sm">
          <p className="text-xl font-bold tracking-tight text-zinc-900">Your cart is empty</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">Add dishes from the menu — they&apos;ll show up here with quantities and totals.</p>
        </div>
        <Link
          href={link("/order/menu")}
          className={`cursor-pointer inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-600/15 transition-colors hover:bg-emerald-400 ${focusRing}`}
        >
          Browse menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-6 rounded-2xl border border-zinc-200/90 bg-white/95 px-5 py-4 shadow-sm ring-1 ring-zinc-100 sm:px-6 sm:py-5">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Your cart</h1>
        <p className="mt-1 text-sm text-zinc-600">Review items, then continue to checkout.</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/90 bg-white px-4 py-3.5 shadow-sm ring-1 ring-zinc-100 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          {TypeIcon && <TypeIcon className={`size-5 shrink-0 ${typeIconColor(orderType)}`} aria-hidden />}
          <span className="text-sm font-semibold text-zinc-900">
            {orderType ? TYPE_LABEL[orderType] : "No order type selected"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOrderTypeModalOpen(true)}
          className={`cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:border-emerald-500/35 hover:bg-emerald-50/80 hover:text-emerald-800 ${focusRing}`}
        >
          Change type
        </button>
      </div>

      <ul className="space-y-3" aria-label="Cart line items">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex gap-3 rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-sm ring-1 ring-zinc-100 transition-all hover:border-zinc-300/80 hover:shadow-md sm:p-3.5"
          >
            <SafeDishImage
              src={line.image}
              alt=""
              className="size-16 shrink-0 self-start rounded-xl object-cover sm:size-[4.5rem]"
              iconClassName="size-8 text-emerald-600/35"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{line.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-700">{formatCustomerMoney(line.price)} each</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(line.id)}
                  className={`shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 ${focusRing}`}
                  aria-label={`Remove ${line.name} from cart`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => (line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1))}
                    className={`cursor-pointer flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:border-red-400/50 hover:bg-red-50 hover:text-red-600 ${focusRing}`}
                    aria-label={line.qty === 1 ? `Remove ${line.name}` : `Decrease ${line.name}`}
                  >
                    <Minus className="size-3.5" aria-hidden />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums text-zinc-900">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(line.id, line.qty + 1)}
                    className={`cursor-pointer flex size-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:border-emerald-500/40 hover:bg-emerald-50 hover:text-emerald-700 ${focusRing}`}
                    aria-label={`Increase ${line.name}`}
                  >
                    <Plus className="size-3.5" aria-hidden />
                  </button>
                </div>
                <p className="text-sm font-bold tabular-nums text-zinc-900">{formatCustomerMoney(line.price * line.qty)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {maxPrepTime > 0 && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
          <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <p>
            <span className="font-semibold">Estimated prep:</span> up to ~{maxPrepTime} min based on your cart.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-zinc-200/90 bg-zinc-50/50 p-5 shadow-inner ring-1 ring-zinc-100">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal</span>
            <span className="font-medium tabular-nums text-zinc-900">{formatCustomerMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-zinc-600">
            <span>Tax (8%)</span>
            <span className="font-medium tabular-nums text-zinc-900">{formatCustomerMoney(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200/80 pt-3 text-base font-bold text-zinc-900">
            <span>Total</span>
            <span className="tabular-nums text-emerald-700">{formatCustomerMoney(total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Link
          href={link("/order/checkout")}
          className={`cursor-pointer flex min-h-[48px] w-full items-center justify-center rounded-xl bg-emerald-500 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-600/15 transition-colors hover:bg-emerald-400 ${focusRing}`}
        >
          Proceed to checkout · {formatCustomerMoney(total)}
        </Link>
        <Link
          href={link("/order/menu")}
          className={`cursor-pointer flex min-h-[44px] w-full items-center justify-center rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 ${focusRing}`}
        >
          ← Continue shopping
        </Link>
      </div>
    </div>
  );
}
