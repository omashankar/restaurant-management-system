"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Menu, ShoppingCart, UserRound,
  UtensilsCrossed, X, Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { path: "/home",                label: "Home" },
  { path: "/order/menu",          label: "Menu" },
  { path: "/order/table-booking", label: "Book Table" },
  { path: "/order/about",         label: "About" },
  { path: "/order/contact",       label: "Contact" },
];

export default function CustomerNavbar() {
  const { cart, setOrderTypeModalOpen, setCartOpen, authUser, logoutCustomer } = useCustomer();
  const pathname = usePathname();
  const { link, prefix } = useRestaurantSlug();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (dark) {
      document.querySelector(".customer-theme")?.classList.add("customer-dark");
    } else {
      document.querySelector(".customer-theme")?.classList.remove("customer-dark");
    }
  }, [dark]);

  const isActive = (path) => {
    const stripped = prefix ? pathname.replace(prefix, "") || "/" : pathname;
    return stripped === path || stripped.startsWith(path + "/");
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass-nav shadow-lg shadow-[#FF6B35]/5"
            : "bg-[#FFF8F3]/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href={link("/home")} className="group flex shrink-0 items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex size-9 items-center justify-center rounded-xl gradient-primary text-white shadow-md shadow-[#FF6B35]/30"
            >
              <UtensilsCrossed className="size-5" />
            </motion.div>
            <span className="font-poppins text-sm font-bold tracking-tight text-[#111827]">
              RMS <span className="gradient-text">Restaurant</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((n) => (
              <Link
                key={n.path}
                href={link(n.path)}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive(n.path)
                    ? "text-[#FF6B35]"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {n.label}
                {isActive(n.path) && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full gradient-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setDark((v) => !v)}
              className="hidden size-9 items-center justify-center rounded-xl border border-[#FFE4D6] bg-white text-[#6B7280] transition-colors hover:border-[#FF6B35]/40 hover:text-[#FF6B35] sm:flex"
            >
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </motion.button>

            {/* Auth */}
            {authUser ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href={link("/account/dashboard")}
                  className="flex items-center gap-1.5 rounded-xl border border-[#FFE4D6] bg-white px-3 py-2 text-xs font-semibold text-[#111827] transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35]"
                >
                  <UserRound className="size-3.5" />
                  {authUser.name?.split(" ")[0] || "Account"}
                </Link>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={logoutCustomer}
                  className="flex items-center gap-1 rounded-xl border border-[#FFE4D6] bg-white px-3 py-2 text-xs font-semibold text-[#6B7280] transition-all hover:border-red-400/40 hover:text-red-500"
                >
                  <LogOut className="size-3.5" />
                </motion.button>
              </div>
            ) : (
              <Link
                href={link("/account/login")}
                className="hidden rounded-xl border border-[#FFE4D6] bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35] sm:inline-flex"
              >
                Login
              </Link>
            )}

            {/* Order Now CTA */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="hidden rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#FF6B35]/30 transition-all hover:shadow-lg hover:shadow-[#FF6B35]/40 sm:inline-flex"
            >
              Order Now
            </motion.button>

            {/* Cart */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex size-10 items-center justify-center rounded-xl border border-[#FFE4D6] bg-white text-[#6B7280] transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35]"
              aria-label="Cart"
            >
              <ShoppingCart className="size-4" />
              <AnimatePresence>
                {cart.itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-white shadow-sm"
                  >
                    {cart.itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex size-10 items-center justify-center rounded-xl border border-[#FFE4D6] bg-white text-[#6B7280] transition-colors hover:bg-[#FFF8F3] md:hidden"
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {open ? (
                  <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="size-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="size-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden border-t border-[#FFE4D6] bg-white/95 backdrop-blur-md md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 pb-4 pt-3">
                {NAV_ITEMS.map((n, i) => (
                  <motion.div
                    key={n.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={link(n.path)}
                      onClick={() => setOpen(false)}
                      className={`flex rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive(n.path)
                          ? "bg-[#FF6B35]/10 text-[#FF6B35]"
                          : "text-[#6B7280] hover:bg-[#FFF8F3] hover:text-[#111827]"
                      }`}
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: NAV_ITEMS.length * 0.05 }}
                  type="button"
                  onClick={() => { setOpen(false); setOrderTypeModalOpen(true); }}
                  className="mt-2 w-full rounded-xl gradient-primary py-3 text-sm font-bold text-white shadow-md shadow-[#FF6B35]/20"
                >
                  Order Now
                </motion.button>
                {authUser ? (
                  <div className="flex gap-2 mt-1">
                    <Link href={link("/account/dashboard")} onClick={() => setOpen(false)}
                      className="flex-1 rounded-xl border border-[#FFE4D6] py-2.5 text-center text-sm font-medium text-[#111827]">
                      Dashboard
                    </Link>
                    <button type="button" onClick={() => { setOpen(false); logoutCustomer(); }}
                      className="flex-1 rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-500">
                      Logout
                    </button>
                  </div>
                ) : (
                  <Link href={link("/account/login")} onClick={() => setOpen(false)}
                    className="mt-1 rounded-xl border border-[#FFE4D6] py-2.5 text-center text-sm font-medium text-[#111827]">
                    Login
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
