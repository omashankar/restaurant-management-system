"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion } from "framer-motion";
import { CheckCircle2, ChefHat, Clock, Home, Package, ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ORDER_STEPS = [
  { icon: CheckCircle2, label: "Confirmed",  desc: "Order received" },
  { icon: ChefHat,      label: "Preparing",  desc: "Kitchen is cooking" },
  { icon: Package,      label: "Ready",      desc: "Almost there" },
  { icon: Truck,        label: "On the way", desc: "Out for delivery" },
];

function SuccessContent() {
  const params  = useSearchParams();
  const orderId = params.get("id") ?? "ORD-XXXX";
  const { link } = useRestaurantSlug();

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ══ TOP CONFETTI BAR ══ */}
      <div className="h-1.5 w-full gradient-primary" />

      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">

        {/* ── Success card ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-3xl bg-white shadow-xl shadow-black/5 overflow-hidden"
        >
          {/* Green top section */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-8 py-10 text-center">
            {/* Animated checkmark */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
              className="relative mx-auto mb-5 flex size-24 items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-green-200/60"
              />
              <div className="relative flex size-24 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="size-12 text-green-500" strokeWidth={1.5} />
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -right-1 -top-1 flex size-9 items-center justify-center rounded-full gradient-primary shadow-lg shadow-[#FF6B35]/30"
              >
                <ShoppingBag className="size-4 text-white" />
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h1 className="font-poppins text-3xl font-black text-[#111827]">Order Placed!</h1>
              <p className="mt-2 text-sm text-gray-500">
                Your order has been received and is being prepared with love.
              </p>
            </motion.div>
          </div>

          <div className="px-8 py-7 space-y-5">

            {/* Order ID */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="flex items-center justify-between rounded-2xl bg-gray-50 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Order ID</p>
                <p className="mt-0.5 font-poppins text-xl font-black text-[#FF6B35]">{orderId}</p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FF6B35]/10">
                <UtensilsCrossed className="size-6 text-[#FF6B35]" />
              </div>
            </motion.div>

            {/* Est. time */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="flex items-center gap-3 rounded-2xl bg-amber-50 px-5 py-3.5">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                <Clock className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-700">Estimated Time</p>
                <p className="text-sm font-black text-amber-900">20 – 30 minutes</p>
              </div>
            </motion.div>

            {/* Order progress steps */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Order Progress</p>
              <div className="flex items-start justify-between">
                {ORDER_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const isFirst = i === 0;
                  return (
                    <div key={s.label} className="flex flex-1 flex-col items-center gap-1.5">
                      {/* Icon + line */}
                      <div className="flex w-full items-center">
                        {i > 0 && (
                          <div className={`h-0.5 flex-1 ${isFirst ? "gradient-primary" : "bg-gray-200"}`} />
                        )}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                            isFirst
                              ? "gradient-primary shadow-md shadow-[#FF6B35]/25"
                              : "border-2 border-gray-200 bg-white"
                          }`}
                        >
                          <Icon className={`size-4 ${isFirst ? "text-white" : "text-gray-300"}`} strokeWidth={1.8} />
                        </motion.div>
                        {i < ORDER_STEPS.length - 1 && (
                          <div className="h-0.5 flex-1 bg-gray-200" />
                        )}
                      </div>
                      {/* Label */}
                      <p className={`text-center text-[10px] font-bold ${isFirst ? "text-[#FF6B35]" : "text-gray-300"}`}>
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
              className="flex flex-col gap-3 pt-2">
              <Link href={link("/order/menu")}
                className="flex items-center justify-center gap-2 rounded-full gradient-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25 transition-all hover:scale-[1.02] hover:shadow-xl">
                <UtensilsCrossed className="size-4" /> Order Again
              </Link>
              <Link href={link("/home")}
                className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-600 transition-all hover:border-[#FF6B35]/30 hover:text-[#111827]">
                <Home className="size-4" /> Back to Home
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Bottom tip ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center text-xs text-gray-400"
        >
          Questions? Contact us at{" "}
          <Link href={link("/order/contact")} className="font-semibold text-[#FF6B35] hover:underline">
            our support page
          </Link>
        </motion.p>

      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="skeleton size-24 rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
