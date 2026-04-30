"use client";

import { useCustomer } from "@/context/CustomerContext";
import { Menu, ShoppingCart, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/home",                label: "Home" },
  { href: "/order/menu",          label: "Menu" },
  { href: "/order/table-booking", label: "Book Table" },
  { href: "/order/about",         label: "About" },
  { href: "/order/contact",       label: "Contact" },
];

export default function CustomerNavbar() {
  const { cart, setOrderTypeModalOpen, setCartOpen } = useCustomer();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/home" className="cursor-pointer inline-flex shrink-0 items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20">
            <UtensilsCrossed className="size-5" aria-hidden />
          </span>
          <span className="text-sm font-bold tracking-tight text-zinc-900">RMS Restaurant</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                isActive(n.href)
                  ? "bg-emerald-500/10 text-emerald-700 shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Order Now — desktop */}
          <button
            type="button"
            onClick={() => setOrderTypeModalOpen(true)}
            className="cursor-pointer hidden rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-400 sm:inline-flex"
          >
            Order Now
          </button>

          {/* Cart */}
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="cursor-pointer relative flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:text-emerald-600"
            aria-label="Cart"
          >
            <ShoppingCart className="size-4" />
            {cart.itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-zinc-950">
                {cart.itemCount}
              </span>
            )}
          </button>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer flex size-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 md:hidden"
            aria-label="Toggle menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 pb-4 pt-3 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(n.href)
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {n.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => { setOpen(false); setOrderTypeModalOpen(true); }}
              className="cursor-pointer mt-2 w-full rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Order Now
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
