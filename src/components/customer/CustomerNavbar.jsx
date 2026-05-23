"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, Menu, MapPin, Moon, Search,
  ShoppingCart, Sun, UserRound, UtensilsCrossed, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router   = useRouter();
  const { link, prefix } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const [open, setOpen]       = useState(false);
  const [dark, setDark]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal]   = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.querySelector(".customer-theme")?.classList.toggle("customer-dark", dark);
  }, [dark]);

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

  return (
    <header className={`sticky top-0 z-50 w-full transition-shadow duration-300 ${scrolled ? "shadow-md" : ""}`}>

      {/* ── Top bar ── */}
      <div className="hidden border-b border-gray-100 bg-white sm:block">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Location */}
          <button type="button" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#FF6B35] transition-colors">
            <MapPin className="size-3.5 text-[#FF6B35]" />
            <span>{info.address ? info.address.split(",")[0] : "Select Your Location"}</span>
            <svg className="size-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {/* Right — dark mode + social */}
          <div className="flex items-center gap-3">
            {/* Social quick links */}
            {cms.social?.instagram && (
              <a href={cms.social.instagram} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-[#FF6B35] transition-colors">Instagram</a>
            )}
            {cms.social?.facebook && (
              <a href={cms.social.facebook} target="_blank" rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-[#FF6B35] transition-colors">Facebook</a>
            )}
            <div className="h-3 w-px bg-gray-200" />
            <button type="button" onClick={() => setDark(v => !v)}
              className="flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-[#FF6B35] transition-colors">
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
              <span>{dark ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href={link("/home")} className="flex shrink-0 items-center gap-2">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex size-9 items-center justify-center rounded-xl gradient-primary shadow-sm shadow-[#FF6B35]/20"
            >
              {info.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={info.logoUrl} alt={info.name} className="size-7 rounded-lg object-cover" />
              ) : (
                <UtensilsCrossed className="size-5 text-white" />
              )}
            </motion.div>
            <span className="font-poppins text-lg font-bold tracking-tight text-[#111827]">
              {info.name.split(" ").slice(0, -1).join(" ") || info.name}
              {info.name.split(" ").length > 1 && (
                <span className="gradient-text"> {info.name.split(" ").slice(-1)[0]}</span>
              )}
            </span>
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {NAV_ITEMS.map((n) => (
              <Link
                key={n.path}
                href={link(n.path)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(n.path)
                    ? "text-[#FF6B35]"
                    : "text-gray-600 hover:text-[#111827]"
                }`}
              >
                {n.label}
                {isActive(n.path) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#FF6B35]"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1.5">

            {/* Search */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setSearchOpen(v => !v)}
              className="flex cursor-pointer size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#FF6B35] transition-colors"
              aria-label="Search"
            >
              <Search className="size-4.5" />
            </motion.button>

            {/* Wishlist placeholder */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              className="hidden cursor-pointer size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#FF6B35] transition-colors sm:flex"
              aria-label="Wishlist"
            >
              <svg className="size-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </motion.button>

            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative cursor-pointer flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#FF6B35] transition-colors"
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
                  className="flex size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#FF6B35] transition-colors"
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
                className="hidden size-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-[#FF6B35] transition-colors sm:flex"
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
              className="hidden rounded-full cursor-pointer gradient-primary px-5 py-2 text-xs font-bold text-white shadow-sm shadow-[#FF6B35]/25 transition-all hover:shadow-md sm:inline-flex"
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
              className="overflow-hidden border-t border-gray-100 bg-white"
            >
              <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
                <Search className="size-4 shrink-0 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search for dishes, burgers, pizza..."
                  className="flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                />
                <button type="submit"
                  className="rounded-full cursor-pointer gradient-primary px-4 py-1.5 text-xs font-bold text-white">
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
              className="overflow-hidden border-t border-gray-100 bg-white md:hidden"
            >
              <div className="flex flex-col gap-1 px-4 pb-5 pt-3">
                {NAV_ITEMS.map((n, i) => (
                  <motion.div key={n.path} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={link(n.path)} onClick={() => setOpen(false)}
                      className={`flex rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        isActive(n.path) ? "bg-[#FF6B35]/8 text-[#FF6B35]" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}>
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => { setOpen(false); setOrderTypeModalOpen(true); }}
                    className="flex-1 rounded-xl gradient-primary py-3 text-sm font-bold text-white shadow-sm">
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
