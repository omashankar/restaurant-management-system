"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Minus, Plus, ShoppingCart, Store, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_COLOR = { "dine-in": "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30", takeaway: "text-amber-600 bg-amber-50 border-amber-200", delivery: "text-rose-600 bg-rose-50 border-rose-200" };

export default function CartPage() {
  const { cart, orderType, setOrderTypeModalOpen } = useCustomer();
  const { link } = useRestaurantSlug();
  const { lines, removeItem, setQty, subtotal, maxPrepTime } = cart;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  if (lines.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="flex size-24 items-center justify-center rounded-3xl bg-white shadow-md"
        >
          <ShoppingCart className="size-12 text-gray-300" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className="font-poppins text-2xl font-black text-[#111827]">Your cart is empty</p>
          <p className="mt-2 text-sm text-gray-500">Add dishes from the menu — they&apos;ll show up here.</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link href={link("/order/menu")}
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25">
            Browse Menu <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
          <h1 className="font-poppins text-3xl font-black text-[#111827]">Your Cart</h1>
          <p className="mt-1 text-sm text-gray-500">Review items, then continue to checkout.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Old header removed — now in hero above */}

      {/* Order type */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="mb-5 flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm">
        <div className={`flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${orderType ? TYPE_COLOR[orderType] : "border-gray-200 text-gray-500"}`}>
          {TypeIcon && <TypeIcon className="size-4 shrink-0" />}
          {orderType ? TYPE_LABEL[orderType] : "No order type"}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setOrderTypeModalOpen(true)}
          className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-[#FF6B35]/30 hover:text-[#FF6B35]">
          Change
        </motion.button>
      </motion.div>

      {/* Items */}
      <ul className="space-y-3" aria-label="Cart items">
        <AnimatePresence>
          {lines.map((line, i) => (
            <motion.li key={line.id} layout
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }} transition={{ delay: i * 0.05 }}
              className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm sm:p-4">
              <SafeDishImage src={line.image} alt={line.name}
                className="size-18 shrink-0 self-start rounded-xl object-cover sm:size-20"
                iconClassName="size-8 text-[#FF6B35]/25" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-poppins text-sm font-bold text-[#111827]">{line.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[#FF6B35]">{formatCustomerMoney(line.price)} each</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} type="button" onClick={() => removeItem(line.id)}
                    className="shrink-0 rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
                    <Trash2 className="size-4" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.85 }} type="button"
                      onClick={() => (line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1))}
                      className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500">
                      <Minus className="size-3.5" />
                    </motion.button>
                    <span className="min-w-[2rem] text-center font-poppins text-sm font-black text-[#111827]">{line.qty}</span>
                    <motion.button whileTap={{ scale: 0.85 }} type="button"
                      onClick={() => setQty(line.id, line.qty + 1)}
                      className="flex size-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:border-[#FF6B35]/40 hover:text-[#FF6B35]">
                      <Plus className="size-3.5" />
                    </motion.button>
                  </div>
                  <p className="font-poppins text-sm font-black text-[#111827]">{formatCustomerMoney(line.price * line.qty)}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Prep time */}
      {maxPrepTime > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3">
          <Clock className="size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800">
            <span className="font-bold">Estimated prep:</span> up to ~{maxPrepTime} min
          </p>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span>
            <span className="font-semibold text-[#111827]">{formatCustomerMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Tax (8%)</span>
            <span className="font-semibold text-[#111827]">{formatCustomerMoney(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-3 font-poppins text-base font-black text-[#111827]">
            <span>Total</span>
            <span className="text-[#FF6B35]">{formatCustomerMoney(total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="mt-5 space-y-3">
        <Link href={link("/order/checkout")}
          className="flex min-h-[52px] w-full items-center justify-between rounded-full gradient-primary px-6 py-3.5 shadow-lg shadow-[#FF6B35]/25 transition-all hover:shadow-xl hover:shadow-[#FF6B35]/35">
          <span className="font-poppins text-sm font-bold text-white">Proceed to Checkout</span>
          <span className="font-poppins text-sm font-bold text-white">{formatCustomerMoney(total)}</span>
        </Link>
        <Link href={link("/order/menu")}
          className="flex min-h-[44px] w-full items-center justify-center rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-500 transition-colors hover:border-[#FF6B35]/30 hover:text-[#111827]">
          ← Continue Shopping
        </Link>
      </div>
    </div>
    </div>
  );
}
