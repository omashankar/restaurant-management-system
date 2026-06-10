"use client";

import LandingBrandLogo from "@/components/landing/LandingBrandLogo";
import { BHOJDESK_BRAND, BHOJDESK_LOGOS } from "@/config/bhojdeskBrand";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV_LINKS } from "./data";

const NAVBAR_HEIGHT = 64;

function scrollToSection(id, closeMobile) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_HEIGHT - 8;
  window.scrollTo({ top, behavior: "smooth" });
  closeMobile?.();
}

export default function LandingNavbar({ navbar = {} }) {
  const {
    logo = { text: BHOJDESK_BRAND.name, iconUrl: BHOJDESK_LOGOS.horizontalLight },
    links = NAV_LINKS.map((l) => ({ label: l.label, href: l.href })),
    ctaPrimary = { label: "Get Started", href: "/signup" },
    ctaSecondary = { label: "Login", href: "/login" },
  } = navbar;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const sectionIds = ["home", ...links.map((l) => l.href?.replace("#", "")).filter(Boolean)];

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: `-${NAVBAR_HEIGHT + 8}px 0px -55% 0px`, threshold: 0 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [links]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleNav = useCallback((href) => {
    if (href?.startsWith("#")) {
      scrollToSection(href.slice(1), () => setOpen(false));
    } else {
      setOpen(false);
    }
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/60 backdrop-blur-xl"
          : "border-transparent bg-white/80 backdrop-blur-xl"
      }`}
    >
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-16 w-full min-w-0 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => handleNav("#home")}
          className="landing-brand-slot landing-brand-slot--nav cursor-pointer inline-flex min-w-0 max-w-[calc(100%-3rem)] shrink-0 items-center sm:max-w-none"
          aria-label="Go to top"
        >
          <LandingBrandLogo
            slot="nav"
            src={logo.iconUrl || undefined}
            alt={logo.text || BHOJDESK_BRAND.name}
            priority
          />
        </button>

        <nav
          className="hidden max-w-[58%] items-center gap-0.5 overflow-x-auto lg:flex xl:max-w-none"
          aria-label="Main navigation"
        >
          {links.map(({ label, href, external }) => {
            const sectionId = href?.startsWith("#") ? href.slice(1) : null;
            const isActive = sectionId && active === sectionId;
            return external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:px-3"
              >
                {label}
              </a>
            ) : (
              <button
                key={label}
                type="button"
                onClick={() => handleNav(href)}
                className={`cursor-pointer relative shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium transition-all duration-200 lg:px-3 ${
                  isActive ? "text-indigo-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-2.5 right-2.5 h-0.5 rounded-full bg-indigo-500 lg:left-3 lg:right-3" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href={ctaSecondary.href}
            className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 lg:px-4"
          >
            {ctaSecondary.label}
          </Link>
          <Link
            href={ctaPrimary.href}
            className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-400/30 transition-all duration-200 hover:bg-indigo-500 lg:px-4"
          >
            {ctaPrimary.label}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 top-16 z-40 bg-slate-900/25 backdrop-blur-[2px] lg:hidden"
          aria-hidden
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`relative z-50 overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 ease-in-out lg:hidden ${
          open ? "max-h-[min(75vh,560px)] overflow-y-auto opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid gap-1 px-4 pb-4 pt-3">
          {links.map(({ label, href, external }) => {
            const sectionId = href?.startsWith("#") ? href.slice(1) : null;
            const isActive = sectionId && active === sectionId;
            return external ? (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              >
                {label}
              </a>
            ) : (
              <button
                key={label}
                type="button"
                onClick={() => handleNav(href)}
                className={`cursor-pointer flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {label}
                {isActive && <span className="size-1.5 rounded-full bg-indigo-500" />}
              </button>
            );
          })}
          <div className="mt-2 grid gap-2 border-t border-slate-100 pt-3">
            <Link
              href={ctaPrimary.href}
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-xl bg-indigo-600 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-500"
            >
              {ctaPrimary.label}
            </Link>
            <Link
              href={ctaSecondary.href}
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {ctaSecondary.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
