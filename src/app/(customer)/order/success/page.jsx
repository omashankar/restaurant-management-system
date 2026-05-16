"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ShoppingBag, UtensilsCrossed, Home } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id") ?? "ORD-XXXX";
  const { link } = useRestaurantSlug();

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 py-16 text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-full max-w-md"
      >
        {/* Success card */}
        <div className="overflow-hidden rounded-3xl border border-[#FFE4D6] bg-white shadow-2xl shadow-[#FF6B35]/10">
          {/* Top gradient bar */}
          <div className="h-2 w-full gradient-primary" />

          <div className="p-8">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative mx-auto mb-6 flex size-24 items-center justify-center"
            >
              <div className="absolute inset-0 rounded-full bg-[#22C55E]/15 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="relative flex size-24 items-center justify-center rounded-full bg-[#22C55E]/15">
                <CheckCircle2 className="size-12 text-[#22C55E]" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -right-1 -top-1 flex size-8 items-center justify-center rounded-full gradient-primary shadow-lg"
              >
                <ShoppingBag className="size-4 text-white" />
              </motion.div>
            </motion.div>

            {/* Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="font-poppins text-3xl font-black text-[#111827]">Order Placed! 🎉</h1>
              <p className="mt-2 text-sm text-[#6B7280]">
                Your order has been received and is being prepared with love.
              </p>
            </motion.div>

            {/* Order ID */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 rounded-2xl border border-[#FFE4D6] bg-[#FFF8F3] px-6 py-4"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7280]">Order ID</p>
              <p className="mt-1 font-poppins text-2xl font-bold text-[#FF6B35]">{orderId}</p>
            </motion.div>

            {/* Est. time */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/8 px-5 py-3"
            >
              <Clock className="size-4 text-[#F59E0B]" />
              <p className="text-sm text-[#92400E]">
                Estimated time: <span className="font-bold">20–30 minutes</span>
              </p>
            </motion.div>

            {/* Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex items-center justify-center gap-2"
            >
              {[
                { emoji: "✅", label: "Confirmed" },
                { emoji: "👨‍🍳", label: "Preparing" },
                { emoji: "🚀", label: "On the way" },
                { emoji: "🎉", label: "Delivered" },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`flex size-9 items-center justify-center rounded-full text-base ${i === 0 ? "gradient-primary shadow-md" : "bg-[#FFF8F3] border border-[#FFE4D6]"}`}>
                      {step.emoji}
                    </span>
                    <span className={`text-[9px] font-semibold ${i === 0 ? "text-[#FF6B35]" : "text-[#6B7280]"}`}>{step.label}</span>
                  </div>
                  {i < 3 && <div className="mb-4 h-0.5 w-4 rounded-full bg-[#FFE4D6]" />}
                </div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-6 flex flex-col gap-3"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link href={link("/order/menu")}
                  className="flex items-center justify-center gap-2 rounded-xl gradient-primary px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25">
                  <UtensilsCrossed className="size-4" /> Order Again
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                <Link href={link("/home")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#FFE4D6] bg-white px-6 py-3 text-sm font-semibold text-[#6B7280] transition-colors hover:border-[#FF6B35]/30 hover:text-[#111827]">
                  <Home className="size-4" /> Back to Home
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[85vh] items-center justify-center">
        <div className="skeleton size-24 rounded-full" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
