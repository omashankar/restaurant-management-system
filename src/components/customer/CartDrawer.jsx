"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2, X, ArrowRight, ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CartDrawer() {
  const { cart, cartOpen, setCartOpen } = useCustomer();
  const { link } = useRestaurantSlug();
  const { lines, removeItem, setQty, subtotal, itemCount } = cart;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[min(100vw,24rem)] flex-col bg-[var(--customer-card)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-customer-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl gradient-primary shadow-md">
                  <ShoppingCart className="size-4 text-white" />
                </div>
                <div>
                  <h2 className="font-poppins text-base font-bold text-customer-text">Your Cart</h2>
                  <p className="text-xs text-customer-muted">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setCartOpen(false)}
                className="flex size-9 cursor-pointer items-center justify-center rounded-xl border border-customer-border text-customer-muted transition-colors hover:bg-customer-cream hover:text-customer-text"
              >
                <X className="size-5" />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <AnimatePresence>
                {lines.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center gap-4 py-16 text-center"
                  >
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-customer-cream">
                      <ShoppingBag className="size-10 text-customer-primary/40" />
                    </div>
                    <div>
                      <p className="font-poppins text-base font-bold text-customer-text">Cart is Empty</p>
                      <p className="mt-1 max-w-[200px] text-xs text-customer-muted">Add delicious dishes from our menu</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Link
                        href={link("/order/menu")}
                        onClick={() => setCartOpen(false)}
                        className="inline-flex items-center gap-2 rounded-xl gradient-primary px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-[var(--customer-primary-shadow)]/20"
                      >
                        Browse Menu <ArrowRight className="size-4" />
                      </Link>
                    </motion.div>
                  </motion.div>
                ) : (
                  <ul className="space-y-3">
                    {lines.map((line) => (
                      <motion.li
                        key={line.id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3 rounded-2xl border border-customer-border bg-customer-cream/50 p-3"
                      >
                        <SafeDishImage
                          src={line.image}
                          alt={line.name}
                          className="size-16 shrink-0 rounded-xl object-cover"
                          iconClassName="size-7 text-customer-primary/30"
                        />
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-snug text-customer-text">{line.name}</p>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              type="button"
                              onClick={() => removeItem(line.id)}
                              className="shrink-0 rounded-lg p-1.5 text-customer-muted transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="size-3.5" />
                            </motion.button>
                          </div>
                          <p className="text-xs font-bold text-customer-primary">{formatCustomerMoney(line.price * line.qty)}</p>
                          <div className="flex items-center gap-2">
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              type="button"
                              onClick={() => (line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1))}
                              className="flex size-7 items-center justify-center rounded-lg border border-customer-border bg-white text-customer-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
                            >
                              <Minus className="size-3" />
                            </motion.button>
                            <span className="min-w-[1.5rem] text-center text-sm font-bold text-customer-text">{line.qty}</span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              type="button"
                              onClick={() => setQty(line.id, line.qty + 1)}
                              className="flex size-7 items-center justify-center rounded-lg border border-customer-border bg-white text-customer-muted transition-colors hover:border-customer-primary/40 hover:bg-customer-cream hover:text-customer-primary"
                            >
                              <Plus className="size-3" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <AnimatePresence>
              {lines.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 border-t border-customer-border bg-[var(--customer-card)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-customer-muted">Subtotal</span>
                    <span className="font-poppins font-bold text-customer-text">{formatCustomerMoney(subtotal)}</span>
                  </div>
                  {cart.maxPrepTime > 0 && (
                    <p className="text-xs text-customer-muted">⏱ Est. prep: ~{cart.maxPrepTime} min</p>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href={link("/order/cart")}
                      onClick={() => setCartOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl gradient-primary px-5 py-3.5 shadow-lg shadow-[var(--customer-primary-shadow)]/25 transition-all hover:shadow-xl hover:shadow-[var(--customer-primary-shadow)]/35"
                    >
                      <span className="text-sm font-bold text-white">View Cart & Checkout</span>
                      <span className="font-poppins text-sm font-bold text-white">{formatCustomerMoney(subtotal)}</span>
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
