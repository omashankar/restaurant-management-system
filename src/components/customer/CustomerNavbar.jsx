"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { resolveHeaderMenu, resolveSiteSocialLinks, resolveTheme } from "@/lib/resolveLayoutTheme";
import CustomerAccountMenu, {
  CustomerAccountLinks,
  CustomerAccountMobileHeader,
} from "@/components/customer/CustomerAccountMenu";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import SocialMediaIcons from "@/components/customer/SocialMediaIcons";
import { customerClasses } from "@/lib/customerTheme";
import SearchModal from "@/components/customer/SearchModal";
import ThemeSwitcher from "@/components/customer/theme/ThemeSwitcher";
import { useCustomerTheme } from "@/context/CustomerThemeContext";
import { useCustomerMotion } from "@/hooks/useCustomerMotion";
import { useCustomerBrandLogos } from "@/hooks/useCustomerBrandLogos";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogIn, Menu, MapPin, Moon, Search, Sun,
  ShoppingCart, X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

const iconBtn =
  "flex size-11 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--customer-primary-soft)]";

export default function CustomerNavbar() {
  const { cart, setOrderTypeModalOpen, setCartOpen, authUser } = useCustomer();
  const pathname = usePathname();
  const { link, prefix } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const { isDark, toggleMode } = useCustomerTheme();
  const motionFx = useCustomerMotion();
  const { showBrandText, logoUrl } = useCustomerBrandLogos();
  const navUsesLogoImage = Boolean(logoUrl);
  const theme = resolveTheme(cms.theme);
  const headerCfg = theme.header ?? {};
  const navItems = resolveHeaderMenu(cms.theme);
  const socialLinks = resolveSiteSocialLinks(cms.theme, cms.social);
  const locationText =
    headerCfg.locationLabel?.trim() ||
    (info.address ? info.address.split(",")[0] : "Select Your Location");
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const isActive = (path) => {
    const stripped = prefix ? pathname.replace(prefix, "") || "/" : pathname;
    return stripped === path || stripped.startsWith(path + "/");
  };

  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => {
      if (!v) setOpen(false);
      return !v;
    });
  }, []);

  const toggleMenu = useCallback(() => {
    setOpen((v) => {
      if (!v) setSearchOpen(false);
      return !v;
    });
  }, []);

  const headerFont = "var(--customer-nav-text)";
  const headerIcon = "var(--customer-nav-muted)";
  const isSticky = headerCfg.sticky !== false;
  const stickyCls = isSticky ? "sticky top-0 z-50" : "relative z-40";

  return (
    <>
    <header
      data-sticky-header={isSticky ? "true" : "false"}
      data-scrolled={scrolled ? "true" : "false"}
      className={`${stickyCls} ct-site-header w-full max-w-[100vw] transition-shadow duration-300`}
      style={{ color: headerFont }}
    >

      {/* ── Top bar (location + theme) ── */}
      {headerCfg.showLocationBar !== false && (
      <div className="border-b border-[var(--customer-border)]">
        <div className="mx-auto flex min-h-11 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => {
              const mapsUrl = info.googleMapsLink?.trim()
                || (info.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}` : "");
              if (mapsUrl) window.open(mapsUrl, "_blank", "noopener,noreferrer");
            }}
            className="flex min-h-[44px] min-w-0 flex-1 items-center gap-1.5 py-1 text-[11px] text-[var(--customer-nav-muted)] transition-colors hover:text-[var(--customer-nav-text)] disabled:cursor-default disabled:opacity-60 sm:flex-none sm:text-xs"
            title={info.address || "Restaurant location"}
            disabled={!info.address && !info.googleMapsLink}
          >
            <MapPin className="size-3.5 shrink-0 text-customer-primary" />
            <span className="truncate">{locationText}</span>
            <svg className="size-3 shrink-0 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 9l6 6 6-6"/></svg>
          </button>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {socialLinks.length > 0 && (
              <SocialMediaIcons
                links={socialLinks}
                variant="header"
                className="gap-1.5"
                animated={false}
              />
            )}
            {socialLinks.length > 0 && (
              <div className="h-3 w-px opacity-20" style={{ backgroundColor: headerFont }} />
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </div>
      )}

      {/* ── Main navbar ── */}
      <div>
        <div className="mx-auto flex min-h-[3.75rem] max-w-7xl items-center gap-2 px-3 py-2 sm:min-h-[4.25rem] sm:gap-3 sm:px-6 lg:min-h-[4.5rem] lg:gap-4 lg:px-8">

          {/* Logo */}
          <Link
            href={link("/home")}
            className="relative z-[1] flex min-w-0 max-w-[44%] items-center overflow-hidden sm:max-w-[50%] md:max-w-[55%] lg:max-w-[14rem] xl:max-w-[16rem]"
          >
            <motion.div whileHover={motionFx.hoverBtn} className="min-w-0 overflow-hidden">
              <RestaurantLogo
                size="sm"
                mode={isDark ? "dark" : "light"}
                showName={!navUsesLogoImage && showBrandText}
                imageOnly={navUsesLogoImage || !showBrandText}
                className="ct-navbar-brand"
              />
            </motion.div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex xl:gap-1" aria-label="Main navigation">
            {navItems.map((n) => (
              <Link
                key={n.id ?? n.path}
                href={link(n.path)}
                className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors duration-200 xl:px-4 ${
                  isActive(n.path)
                    ? "text-customer-primary"
                    : "text-[var(--customer-nav-muted)] hover:text-[var(--customer-nav-text)]"
                }`}
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

          {/* Actions */}
          <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-0.5 sm:gap-1">

            {headerCfg.showSearch !== false && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={toggleSearch}
              className={`${iconBtn} hidden lg:flex`}
              style={{ color: headerIcon }}
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search className="size-4.5" />
            </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setCartOpen(true)}
              className={`${iconBtn} relative hover:text-customer-primary`}
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
                    {cart.itemCount > 9 ? "9+" : cart.itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Theme — desktop only when location bar is hidden */}
            {headerCfg.showLocationBar === false && (
              <ThemeSwitcher className="hidden lg:flex" />
            )}

            {/* Account — desktop: single entry to login/register tabs */}
            {authUser ? (
              <CustomerAccountMenu className="hidden lg:block" />
            ) : (
              <Link
                href={link("/account/login")}
                className={`${customerClasses.btnSecondary} hidden min-h-[40px] items-center gap-1.5 px-4 py-2 text-xs font-bold lg:inline-flex`}
              >
                <LogIn className="size-3.5" aria-hidden />
                Login
              </Link>
            )}

            {headerCfg.showLocationBar === false && socialLinks.length > 0 && (
              <SocialMediaIcons
                links={socialLinks}
                variant="header"
                className="hidden gap-1 lg:flex"
                animated={false}
              />
            )}

            <motion.button
              whileHover={motionFx.hoverBtn}
              whileTap={motionFx.tapSm}
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="ct-btn ct-btn-primary !hidden cursor-pointer px-4 py-2 text-xs font-bold lg:!inline-flex xl:px-5"
            >
              Order Now
            </motion.button>

            <button
              type="button"
              onClick={toggleMenu}
              className={`${iconBtn} lg:hidden`}
              style={{ color: headerIcon }}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <AnimatePresence mode="wait">
                {open
                  ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="size-5" /></motion.div>
                  : <motion.div key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="size-5" /></motion.div>
                }
              </AnimatePresence>
            </button>
          </div>
        </div>

      </div>
    </header>

    {/* Mobile / tablet menu — left slide-in drawer */}
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="ct-elevation-overlay fixed left-0 top-0 z-[60] flex h-full w-full max-w-[min(100vw,20rem)] flex-col bg-[var(--customer-card)] lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="flex items-center justify-between gap-3 border-b border-customer-border px-4 py-4 sm:px-5">
              <Link
                href={link("/home")}
                onClick={() => setOpen(false)}
                className="flex min-w-0 flex-1 items-center overflow-hidden"
              >
                <RestaurantLogo
                  size="sm"
                  mode={isDark ? "dark" : "light"}
                  showName={!navUsesLogoImage && showBrandText}
                  imageOnly={navUsesLogoImage || !showBrandText}
                  className="ct-navbar-brand max-h-9"
                />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-10 min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-full text-customer-muted transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-text"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
              <div className="mb-3 rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-surface)] p-2">
                {authUser ? (
                  <>
                    <CustomerAccountMobileHeader
                      user={authUser}
                      onNavigate={() => setOpen(false)}
                    />
                    <CustomerAccountLinks onNavigate={() => setOpen(false)} className="mt-1" />
                  </>
                ) : (
                  <Link
                    href={link("/account/login")}
                    onClick={() => setOpen(false)}
                    className={`${customerClasses.btnSecondary} flex min-h-[44px] w-full items-center justify-center gap-1.5 text-sm font-bold`}
                  >
                    <LogIn className="size-4" aria-hidden />
                    Login
                  </Link>
                )}
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                {headerCfg.showSearch !== false && (
                  <button
                    type="button"
                    onClick={() => { setOpen(false); setSearchOpen(true); }}
                    className="flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-2 text-xs font-semibold text-customer-text transition-colors hover:border-[var(--customer-primary-border)] hover:bg-[var(--customer-primary-soft)]"
                  >
                    <Search className="size-4.5 text-customer-primary" />
                    Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleMode}
                  className={`flex min-h-[52px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[var(--customer-border)] bg-[var(--customer-surface)] px-2 text-xs font-semibold text-customer-text transition-colors hover:border-[var(--customer-primary-border)] hover:bg-[var(--customer-primary-soft)] ${headerCfg.showSearch === false ? "col-span-2" : ""}`}
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <Sun className="size-4.5 text-customer-primary" />
                  ) : (
                    <Moon className="size-4.5 text-customer-primary" />
                  )}
                  {isDark ? "Light mode" : "Dark mode"}
                </button>
              </div>

              <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                {navItems.map((n, i) => (
                  <motion.div
                    key={n.id ?? n.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                  >
                    <Link
                      href={link(n.path)}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-[48px] items-center rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        isActive(n.path)
                          ? "bg-customer-primary/8 text-customer-primary"
                          : "text-[var(--customer-nav-muted)] hover:bg-[var(--customer-primary-soft)] hover:text-[var(--customer-nav-text)]"
                      }`}
                    >
                      {n.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {socialLinks.length > 0 && (
                <div className="mt-4 border-t border-[var(--customer-border)] pt-4">
                  <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: headerFont }}>
                    Follow us
                  </p>
                  <SocialMediaIcons links={socialLinks} variant="inline" animated={false} />
                </div>
              )}
            </div>

            <div className="border-t border-customer-border px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
              <button
                type="button"
                onClick={() => { setOpen(false); setOrderTypeModalOpen(true); }}
                className="ct-btn ct-btn-primary min-h-[48px] w-full py-3 text-sm font-bold"
              >
                Order Now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
