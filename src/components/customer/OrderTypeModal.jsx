"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Check, ConciergeBell, Store, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const TYPES = [
  {
    id: "dine-in",
    label: "Dine-In",
    desc: "Eat at our restaurant",
    Icon: Store,
    gradient: "from-orange-400 to-customer-primary",
    active: "border-customer-primary bg-customer-primary/5",
  },
  {
    id: "takeaway",
    label: "Takeaway",
    desc: "Pick up your order",
    Icon: ConciergeBell,
    gradient: "from-amber-400 to-amber-500",
    active: "border-amber-500 bg-amber-50",
  },
  {
    id: "delivery",
    label: "Delivery",
    desc: "Delivered to your door",
    Icon: Bike,
    gradient: "from-rose-400 to-rose-500",
    active: "border-rose-500 bg-rose-50",
  },
];

export default function OrderTypeModal() {
  const {
    orderTypeModalOpen,
    closeOrderTypeModal,
    completeOrderTypeChoice,
    orderType,
    pendingCartItem,
  } = useCustomer();
  const router = useRouter();
  const pathname = usePathname();
  const { link } = useRestaurantSlug();

  const choose = (type) => {
    const hadPendingItem = completeOrderTypeChoice(type);
    const menuHref = link("/order/menu");
    const onMenuPage =
      pathname === menuHref ||
      pathname?.endsWith("/order/menu") ||
      pathname?.includes("/order/menu");

    if (hadPendingItem && !onMenuPage) {
      router.push(menuHref);
    }
  };

  return (
    <AnimatePresence>
      {orderTypeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeOrderTypeModal}
          />

          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="relative overflow-hidden px-6 pb-4 pt-6">
              <div className="pointer-events-none absolute inset-0 gradient-primary opacity-5" />
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-poppins text-xl font-bold text-customer-text">
                    How would you like to order?
                  </h2>
                  <p className="mt-1 text-sm text-customer-muted">
                    {pendingCartItem
                      ? `We'll add "${pendingCartItem.name}" to your cart right after you choose.`
                      : "Choose your preferred dining style. You can change this anytime."}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={closeOrderTypeModal}
                  className="flex cursor-pointer size-9 items-center justify-center rounded-xl border border-customer-border text-customer-muted transition-colors hover:bg-customer-cream"
                  aria-label="Close"
                >
                  <X className="size-5" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-3 px-6 pb-6">
              {TYPES.map(({ id, label, desc, Icon, gradient, active }, i) => {
                const isSelected = orderType === id;
                return (
                  <motion.button
                    key={id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => choose(id)}
                    className={`flex cursor-pointer w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 ${
                      isSelected
                        ? active
                        : "border-customer-border bg-white hover:border-customer-primary/30 hover:bg-customer-cream"
                    }`}
                  >
                    <div
                      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-md`}
                    >
                      <Icon className="size-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-poppins font-semibold text-customer-text">{label}</p>
                      <p className="text-xs text-customer-muted">{desc}</p>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="flex size-6 shrink-0 items-center justify-center rounded-full gradient-primary shadow-sm"
                        >
                          <Check className="size-3.5 text-white" strokeWidth={3} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
