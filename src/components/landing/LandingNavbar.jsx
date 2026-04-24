"use client";

import { Menu, UtensilsCrossed, X } from "lucide-react";
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

/**
 * LandingNavbar — accepts optional `navbar` prop from CMS.
 * Falls back to hardcoded data.js values when prop is not provided.
 *
 * Props:
 *   navbar: {
 *     logo:         { text: string, iconUrl?: string }
 *     links:        [{ label, href, external? }]
 *     ctaPrimary:   { label, href }
 *     ctaSecondary: { label, href }
 *   }
 */
export default function LandingNavbar({ navbar = {} }) {
  const {
    logo         = { text: "Restaurant OS" },
    links        = NAV_LINKS.map(l => ({ label: l.label, href: l.href })),
    ctaPrimary   = { label: "Get Started", href: "/signup" },
    ctaSecondary = { label: "Login",       href: "/login"  },
  } = navbar;

  const [open, setOpen]         = useState(false);
  const [active, setActive]     = useState("");
  const [scrolled, setScrolled] = useState(false);
  const observerRef             = useRef(null);

  /* ── Intersection Observer — active section highlight ── */
  useEffect(() => {
    const sectionIds = links
      .map(l => l.href?.replace("#", ""))
      .filter(Boolean);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: `-${NAVBAR_HEIGHT + 8}px 0px -60% 0px`, threshold: 0 }
    );

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observerRef.current.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [links]);

  /* ── Scroll shadow ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Close mobile on resize ── */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNav = useCallback((href) => {
    if (href?.startsWith("#")) {
      scrollToSection(href.slice(1), () => setOpen(false));
    } else {
      setOpen(false);
    }
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${
      scrolled
        ? "border-slate-200/80 bg-white/95 shadow-sm shadow-slate-200/60 backdrop-blur-xl"
        : "border-transparent bg-white/80 backdrop-blur-xl"
    }`}>
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* ── Logo ── */}
        <button type="button" onClick={() => handleNav("#home")}
          className="cursor-pointer inline-flex items-center gap-2.5" aria-label="Go to top">
          <span className="inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-400/30">
            <UtensilsCrossed className="size-4" />
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">{logo.text}</span>
        </button>

        {/* ── Desktop nav ── */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {links.map(({ label, href, external }) => {
            const sectionId = href?.startsWith("#") ? href.slice(1) : null;
            const isActive  = sectionId && active === sectionId;
            return external ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
                {label}
              </a>
            ) : (
              <button key={label} type="button" onClick={() => handleNav(href)}
                className={`cursor-pointer relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive ? "text-indigo-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}>
                {label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-3 right-3 h-0.5 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Desktop CTA ── */}
        <div className="hidden items-center gap-2 md:flex">
          <Link href={ctaSecondary.href}
            className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50">
            {ctaSecondary.label}
          </Link>
          <Link href={ctaPrimary.href}
            className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-400/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500">
            {ctaPrimary.label}
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button type="button" onClick={() => setOpen(v => !v)}
          className="cursor-pointer inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </div>

      {/* ── Mobile menu ── */}
      <div className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 ease-in-out md:hidden ${
        open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="grid gap-1 px-4 pb-4 pt-3">
          {links.map(({ label, href, external }) => {
            const sectionId = href?.startsWith("#") ? href.slice(1) : null;
            const isActive  = sectionId && active === sectionId;
            return external ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
                {label}
              </a>
            ) : (
              <button key={label} type="button" onClick={() => handleNav(href)}
                className={`cursor-pointer flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"
                }`}>
                {label}
                {isActive && <span className="size-1.5 rounded-full bg-indigo-500" />}
              </button>
            );
          })}
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Link href={ctaSecondary.href} onClick={() => setOpen(false)}
              className="cursor-pointer rounded-xl border border-slate-300 px-3 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
              {ctaSecondary.label}
            </Link>
            <Link href={ctaPrimary.href} onClick={() => setOpen(false)}
              className="cursor-pointer rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500">
              {ctaPrimary.label}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
