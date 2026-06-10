"use client";

import { useCheckoutMeta } from "@/hooks/useCheckoutMeta";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Home,
  Loader2,
  Package,
  ShoppingBag,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { customerClasses } from "@/lib/customerTheme";
import { useSearchParams } from "next/navigation";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { Suspense, useCallback, useEffect, useState } from "react";

const ORDER_STEPS = [
  { icon: CheckCircle2, label: "Confirmed", desc: "Order received" },
  { icon: ChefHat, label: "Preparing", desc: "Kitchen is cooking" },
  { icon: Package, label: "Ready", desc: "Ready to serve" },
  { icon: Truck, label: "Done", desc: "Completed" },
];

const STEP_INDEX = {
  pending: 0,
  preparing: 1,
  ready: 2,
  completed: 3,
  cancelled: -1,
};

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id") ?? "";
  const { link } = useRestaurantSlug();
  const { meta } = useCheckoutMeta();
  const [tracked, setTracked] = useState(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  const fetchStatus = useCallback(async (silent = false) => {
    if (!orderId) {
      if (!silent) setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/customer/orders/track?orderId=${encodeURIComponent(orderId)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data?.success && data.order) setTracked(data.order);
    } catch {
      /* keep fallback UI */
    } finally {
      if (!silent) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  useLiveRefresh(() => fetchStatus(true), { intervalMs: 15000, eventName: null });

  const displayId = tracked?.orderId || orderId || "—";
  const etaLabel =
    tracked?.etaLabel ??
    meta.etaMinutes?.[tracked?.orderType ?? "takeaway"] ??
    meta.etaMinutes?.takeaway ??
    "20-30";
  const activeStep = tracked?.statusKey
    ? STEP_INDEX[tracked.statusKey] ?? 0
    : 0;

  return (
    <div className="ct-page-shell">
      <div className="h-1.5 w-full gradient-primary" />

      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="overflow-hidden ct-surface-card rounded-3xl"
        >
          <div className={`${customerClasses.successHero} px-4 py-8 text-center sm:px-8 sm:py-10`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
              className="relative mx-auto mb-5 flex size-24 items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,#22c55e_22%,transparent)]"
              />
              <div className={`relative flex size-24 items-center justify-center rounded-full ${customerClasses.iconRingSuccess}`}>
                <CheckCircle2 className="size-12" strokeWidth={1.5} />
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -right-1 -top-1 flex size-9 items-center justify-center rounded-full gradient-primary"
              >
                <ShoppingBag className="size-4 text-white" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="font-poppins text-3xl font-black text-customer-text">Order Placed!</h1>
              <p className="mt-2 text-sm text-customer-muted">
                {tracked?.statusLabel
                  ? `Status: ${tracked.statusEmoji ?? ""} ${tracked.statusLabel}`
                  : "Your order has been received and is being prepared."}
              </p>
            </motion.div>
          </div>

          <div className="space-y-5 px-4 py-6 sm:px-8 sm:py-7">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between rounded-2xl bg-[var(--customer-cream)] px-5 py-4"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-customer-muted">Order ID</p>
                <p className="mt-0.5 break-all font-poppins text-lg font-black text-customer-primary sm:text-xl" title={displayId}>
                  {loading ? "…" : displayId}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-customer-primary/10">
                {loading ? (
                  <Loader2 className="size-6 animate-spin text-customer-primary" />
                ) : (
                  <RestaurantLogo size="sm" imageOnly />
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="ct-banner-warning px-5 py-3.5"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-customer-primary/10">
                <Clock className="size-5 text-customer-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-customer-muted">Estimated Time</p>
                <p className="text-sm font-black text-customer-text">{etaLabel} minutes</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-customer-muted">
                Order Progress
              </p>
              <div className="-mx-1 flex items-start justify-between overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
                {ORDER_STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done = i <= activeStep;
                  return (
                    <div key={s.label} className="flex min-w-[4.25rem] flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full items-center">
                        {i > 0 && (
                          <div
                            className={`h-0.5 flex-1 ${i <= activeStep ? "gradient-primary" : "bg-[var(--customer-border)]"}`}
                          />
                        )}
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                          className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                            done
                              ? "gradient-primary"
                              : "border-2 border-customer-border bg-[var(--customer-card)]"
                          }`}
                        >
                          <Icon
                            className={`size-4 ${done ? "text-white" : "text-customer-muted"}`}
                            strokeWidth={1.8}
                          />
                        </motion.div>
                        {i < ORDER_STEPS.length - 1 && (
                          <div
                            className={`h-0.5 flex-1 ${i < activeStep ? "gradient-primary" : "bg-[var(--customer-border)]"}`}
                          />
                        )}
                      </div>
                      <p
                        className={`max-w-[4.5rem] text-center text-[11px] font-bold leading-tight ${done ? "text-customer-primary" : "text-customer-muted"}`}
                      >
                        {s.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75 }}
              className="flex flex-col gap-3 pt-2"
            >
              <Link
                href={link("/account/dashboard")}
                className={`${customerClasses.btnOutlineDark} w-full gap-2 py-3 text-sm`}
              >
                Track in My Account
              </Link>
              <Link
                href={link("/order/menu")}
                className={`${customerClasses.btnPrimary} w-full gap-2 py-3.5 text-sm transition-all hover:scale-[1.02]`}
              >
                <UtensilsCrossed className="size-4" /> Order Again
              </Link>
              <Link
                href={link("/home")}
                className={`${customerClasses.btnOutlineDark} w-full gap-2 py-3 text-sm`}
              >
                <Home className="size-4" /> Back to Home
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-6 text-center text-xs text-customer-muted"
        >
          Questions?{" "}
          <Link href={link("/order/contact")} className="font-semibold text-customer-primary hover:underline">
            Contact support
          </Link>
        </motion.p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="ct-page-shell flex min-h-screen items-center justify-center">
          <Loader2 className="size-10 animate-spin text-customer-primary" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
