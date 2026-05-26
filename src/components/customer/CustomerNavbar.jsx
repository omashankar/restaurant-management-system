"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { resolveHeaderMenu, resolveTheme } from "@/lib/resolveLayoutTheme";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import ThemeSwitcher from "@/components/customer/theme/ThemeSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Menu, MapPin, Search,
  ShoppingCart, UserRound, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function CustomerNavbar() {
  const { cart, setOrderTypeModalOpen, setCartOpen, authUser, logoutCustomer } = useCustomer();
  const pathname = usePathname();
  const router   = useRouter();
  const { link, prefix } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const theme = resolveTheme(cms.theme);
  const headerCfg = theme.header ?? {};
  const navItems = resolveHeaderMenu(cms.theme);
  const headerColors = headerCfg.colors ?? {};
  const locationText =
    headerCfg.locationLabel?.trim() ||
    (info.address ? info.address.split(",")[0] : "Select Your Location");
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => {
    const stripped = prefix ? pathname.replace(prefix, "") || "/" : pathname;
    return stripped === path || stripped.startsWith(path + "/");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchVal.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchVal("");
    router.push(link(`/order/menu?q=${encodeURIComponent(q)}`));
  };

  const headerBg = headerColors.background?.trim() || "#ffffff";
  const headerFont = headerColors.font?.trim() || "#333333";
  const headerIcon = headerColors.icon?.trim() || "#9c9c9c";
  const stickyCls = headerCfg.sticky !== false ? "sticky top-0" : "";

  return (
    <header
      className={`${stickyCls} z-50 w-full transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}
      style={{ backgroundColor: headerBg, color: headerFont }}
    >

      {/* ── Top bar ── */}
      {headerCfg.showLocationBar !== false && (
      <div className="hidden border-b border-black/5 sm:block" style={{ backgroundColor: headerBg }}>
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Location */}
          <button type="button" className="flex items-center gap-1.5 text-xs opacity-80 hover:opacity-100 transition-colors" style={{ color: headerFont }}>
            <MapPin className="size-3.5" style={{ color: "var(--customer-primary, #FF6B35)" }} />
            <span>{locationText}</span>
            <svg className="size-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {/* Right — dark mode + social */}
          <div className="flex items-center gap-3">
            {/* Social quick links */}
            {cms.social?.instagram && (
              <a href={cms.social.instagram} target="_blank" rel="noopener noreferrer"
                className="text-xs transition-colors hover:text-customer-primary"
                style={{ color: headerIcon }}>Instagram</a>
            )}
            {cms.social?.facebook && (
              <a href={cms.social.facebook} target="_blank" rel="noopener noreferrer"
                className="text-xs transition-colors hover:text-customer-primary"
                style={{ color: headerIcon }}>Facebook</a>
            )}
            <div className="h-3 w-px opacity-20" style={{ backgroundColor: headerFont }} />
            <ThemeSwitcher showLabel />
          </div>
        </div>
      </div>
      )}

      {/* ── Main navbar ── */}
      <div className="border-b border-black/5" style={{ backgroundColor: headerBg }}>
        <div className="mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:min-h-[4.5rem] sm:gap-4 sm:px-6 lg:px-8">

          {/* Logo — image only (full mark from CMS) */}
          <Link href={link("/home")} className="flex shrink-0 items-center min-w-0">
            <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
              <RestaurantLogo size="md" mode="light" imageOnly />
            </motion.div>
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((n) => (
              <Link
                key={n.id ?? n.path}
                href={link(n.path)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(n.path) ? "text-[var(--customer-primary,#FF6B35)]" : "opacity-75 hover:opacity-100"
                }`}
                style={!isActive(n.path) ? { color: headerFont } : undefined}
              >
                {n.label}
                {isActive(n.path) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-customer-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1.5">

            {/* Search */}
            {headerCfg.showSearch !== false && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setSearchOpen(v => !v)}
              className="flex cursor-pointer size-9 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              style={{ color: headerIcon }}
              aria-label="Search"
            >
              <Search className="size-4.5" />
            </motion.button>
            )}

            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-primary"
              style={{ color: headerIcon }}
              aria-label="Cart"
            >
              <ShoppingCart className="size-4.5" />
              <AnimatePresence>
                {cart.itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full gradient-primary text-[9px] font-bold text-white"
                  >
                    {cart.itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* User */}
            {authUser ? (
              <div className="hidden items-center gap-1 sm:flex">
                <Link href={link("/account/dashboard")}
                  className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-primary"
                  style={{ color: headerIcon }}
                  aria-label="Account">
                  <UserRound className="size-4.5" />
                </Link>
                <button type="button" onClick={logoutCustomer}
                  className="flex cursor-pointer size-9 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  aria-label="Logout">
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <Link href={link("/account/login")}
                className="hidden size-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-primary sm:flex"
                style={{ color: headerIcon }}
                aria-label="Login">
                <UserRound className="size-4.5" />
              </Link>
            )}

            {/* Order Now — desktop */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="ct-btn ct-btn-primary hidden cursor-pointer px-5 py-2 text-xs font-bold sm:inline-flex"
            >
              Order Now
            </motion.button>

            {/* Mobile hamburger */}
            <button type="button" onClick={() => setOpen(v => !v)}
              className="flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 md:hidden"
              aria-label="Toggle menu">
              <AnimatePresence mode="wait">
                {open
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="size-5" /></motion.div>
                  : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="size-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Search bar dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t"
              style={{ borderColor: "var(--customer-border)", backgroundColor: headerBg }}
            >
              <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
                <Search className="size-4 shrink-0" style={{ color: headerIcon }} />
                <input
                  autoFocus
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search for dishes, burgers, pizza..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
                  style={{ color: headerFont }}
                />
                <button type="submit" className="ct-btn ct-btn-primary cursor-pointer px-4 py-1.5 text-xs font-bold">
                  Search
                </button>
                <button type="button" onClick={() => setSearchOpen(false)}
                  className="text-gray-400 cursor-pointer hover:text-gray-600">
                  <X className="size-4" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t md:hidden"
              style={{ borderColor: "color-mix(in srgb, var(--customer-border) 40%, transparent)", backgroundColor: headerBg }}
            >
              <div className="flex flex-col gap-1 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3">
                {navItems.map((n, i) => (
                  <motion.div key={n.id ?? n.path} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={link(n.path)} onClick={() => setOpen(false)}
                      className={`flex rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive(n.path) ? "bg-customer-primary/8 text-customer-primary" : "hover:bg-black/5"
                      }`}
                      style={!isActive(n.path) ? { color: headerFont } : undefined}>
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
                  <ThemeSwitcher showLabel className="w-full justify-center sm:w-auto" />
                  <button type="button" onClick={() => { setOpen(false); setOrderTypeModalOpen(true); }}
                    className="ct-btn ct-btn-primary min-h-[44px] flex-1 py-3 text-sm font-bold">
                    Order Now
                  </button>
                  {authUser ? (
                    <button type="button" onClick={() => { setOpen(false); logoutCustomer(); }}
                      className="rounded-xl border border-red-200 px-4 py-3 text-sm font-medium text-red-500">
                      Logout
                    </button>
                  ) : (
                    <Link href={link("/account/login")} onClick={() => setOpen(false)}
                      className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
