"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { calcOrderTotals, useCheckoutMeta } from "@/hooks/useCheckoutMeta";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { orderTypeChipClass } from "@/lib/customerOrderTypeStyles";
import { customerClasses, customerMotion, customerPage, customerType } from "@/lib/customerTheme";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Minus, Plus, ShoppingCart, Store, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
export default function CartPage() {
  const { cart, orderType, setOrderTypeModalOpen } = useCustomer();
  const { link } = useRestaurantSlug();
  const { meta } = useCheckoutMeta();
  const { lines, removeItem, setQty, subtotal, maxPrepTime } = cart;
  const { tax, delivery, total, taxRate } = calcOrderTotals({
    subtotal,
    orderType,
    taxPercentage: meta.taxPercentage,
    deliveryCharge: meta.deliveryCharge,
  });
  const TypeIcon = orderType ? TYPE_ICON[orderType] : null;

  if (lines.length === 0) {
    return (
      <div className="ct-page-shell flex min-h-[70vh] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={`size-24 ${customerPage.emptyIcon}`}
        >
          <ShoppingCart className="size-12" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <p className={`${customerType.cardTitle} text-2xl`}>Your cart is empty</p>
          <p className={`mt-2 ${customerType.bodySm}`}>Add dishes from the menu — they&apos;ll show up here.</p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={customerMotion.tapSm}>
          <Link href={link("/order/menu")} className={`${customerClasses.btnPrimary} gap-2 px-8 py-3.5 text-sm`}>
            Browse Menu <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="ct-page-shell">
      <div className="ct-page-header">
        <div className={customerPage.headerInnerLeft}>
          <h1 className={`${customerType.heroTitle} text-3xl`}>Your Cart</h1>
          <p className={`mt-1 ${customerType.bodySm}`}>Review items, then continue to checkout.</p>
        </div>
      </div>

      <div className={`${customerPage.narrow} pb-safe`}>
      {/* Old header removed — now in hero above */}

      {/* Order type */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="mb-5 flex items-center justify-between ct-surface-card px-4 py-3.5">
        <div className={`flex items-center gap-2.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold ${orderType ? orderTypeChipClass(orderType) : "border-customer-border text-customer-muted"}`}>
          {TypeIcon && <TypeIcon className="size-4 shrink-0" />}
          {orderType ? TYPE_LABEL[orderType] : "No order type"}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setOrderTypeModalOpen(true)}
          className="min-h-[44px] rounded-full border border-customer-border bg-[var(--customer-card)] px-4 py-2 text-xs font-semibold text-customer-muted transition-colors hover:border-customer-primary/30 hover:text-customer-primary">
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
              className="flex gap-3 ct-surface-card p-3 sm:p-4">
              <SafeDishImage src={line.image} alt={line.name}
                className="size-20 shrink-0 self-start rounded-xl object-cover"
                iconClassName="size-8 text-customer-primary/25" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-poppins text-sm font-bold text-customer-text">{line.name}</p>
                    <p className="mt-0.5 text-xs font-semibold text-customer-primary">{formatCustomerMoney(line.price)} each</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.85 }} type="button" onClick={() => removeItem(line.id)}
                    className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center ${customerClasses.btnDangerGhost}`}>
                    <Trash2 className="size-4" />
                  </motion.button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <motion.button whileTap={{ scale: 0.85 }} type="button"
                      onClick={() => (line.qty === 1 ? removeItem(line.id) : setQty(line.id, line.qty - 1))}
                      className={`flex size-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-customer-border bg-[var(--customer-card)] ${customerClasses.btnDangerGhost}`}>
                      <Minus className="size-3.5" />
                    </motion.button>
                    <span className="min-w-[2rem] text-center font-poppins text-sm font-black text-customer-text">{line.qty}</span>
                    <motion.button whileTap={{ scale: 0.85 }} type="button"
                      onClick={() => setQty(line.id, line.qty + 1)}
                      className="flex size-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-customer-border bg-[var(--customer-card)] text-customer-muted transition-colors hover:border-customer-primary/40 hover:text-customer-primary">
                      <Plus className="size-3.5" />
                    </motion.button>
                  </div>
                  <p className="font-poppins text-sm font-black text-customer-text">{formatCustomerMoney(line.price * line.qty)}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Prep time */}
      {maxPrepTime > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`mt-4 ${customerClasses.bannerWarning}`}>
          <Clock className="size-4 shrink-0 text-customer-primary" />
          <p className="text-sm text-customer-text">
            <span className="font-bold">Estimated prep:</span> up to ~{maxPrepTime} min
          </p>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mt-5 ct-surface-card p-5">
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-customer-muted">
            <span>Subtotal</span>
            <span className="font-semibold text-customer-text">{formatCustomerMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-customer-muted">
            <span>Tax ({taxRate}%)</span>
            <span className="font-semibold text-customer-text">{formatCustomerMoney(tax)}</span>
          </div>
          {delivery > 0 && (
            <div className="flex justify-between text-customer-muted">
              <span>Delivery</span>
              <span className="font-semibold text-customer-text">{formatCustomerMoney(delivery)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-customer-border pt-3 font-poppins text-base font-black text-customer-text">
            <span>Total</span>
            <span className="text-customer-primary">{formatCustomerMoney(total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <div className="mt-5 space-y-3">
        {orderType ? (
          <Link href={link("/order/checkout")}
            className={`${customerClasses.btnPrimaryLg} items-center justify-between gap-3 px-6`}>
            <span>Proceed to Checkout</span>
            <span className="font-poppins font-bold">{formatCustomerMoney(total)}</span>
          </Link>
        ) : (
          <motion.button
            whileTap={customerMotion.tapSm}
            type="button"
            onClick={() => setOrderTypeModalOpen(true)}
            className={`${customerClasses.btnPrimaryLg} w-full items-center justify-center gap-2 px-6`}
          >
            Select Order Type to Continue
          </motion.button>
        )}
        <Link href={link("/order/menu")}
          className={`${customerClasses.btnOutlineDark} min-h-[44px] w-full justify-center py-3 text-sm`}>
          ← Continue Shopping
        </Link>
      </div>
    </div>
    </div>
  );
}
