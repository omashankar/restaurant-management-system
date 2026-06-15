"use client";

import RestaurantLogo from "@/components/customer/RestaurantLogo";
import { useCustomerTheme } from "@/context/CustomerThemeContext";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { CalendarClock, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const HERO_POINTS = [
  { icon: ShoppingBag, text: "Order online & track deliveries" },
  { icon: CalendarClock, text: "Book tables in a few taps" },
  { icon: ShieldCheck, text: "Secure login with OTP or email" },
];

export default function CustomerAuthLayout({ children }) {
  const { info } = useRestaurantInfo();
  const { isDark } = useCustomerTheme();
  const restaurantName = info.name?.trim() || "Our Restaurant";

  return (
    <div className="ct-auth-page">
      <div className="ct-auth-layout">
        <aside className="ct-auth-hero hidden lg:flex" aria-hidden="false">
          <div className="ct-auth-hero__glow" />
          <div className="ct-auth-hero__inner">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative z-[1]"
            >
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <Sparkles className="size-3.5" aria-hidden />
                Customer portal
              </div>

              <RestaurantLogo
                size="lg"
                mode="dark"
                imageOnly
                className="mb-6 ct-auth-hero__logo"
              />

              <h1 className="font-poppins text-3xl font-bold leading-tight tracking-tight text-white xl:text-4xl">
                Welcome to{" "}
                <span className="block text-white/95">{restaurantName}</span>
              </h1>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75 xl:text-base">
                Sign in to view orders, manage bookings, and enjoy a faster checkout every time you visit.
              </p>

              <ul className="mt-10 space-y-4">
                {HERO_POINTS.map(({ icon: Icon, text }, i) => (
                  <motion.li
                    key={text}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-center gap-3 text-sm text-white/90"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    {text}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </aside>

        <main className="ct-auth-main">
          <div className="ct-auth-stack">
            <div className="ct-auth-mobile-header lg:hidden">
              <RestaurantLogo size="md" mode={isDark ? "dark" : "light"} imageOnly />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="ct-auth-card"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
