"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { CalendarClock, Mail, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default function CustomerFooter() {
  const { link } = useRestaurantSlug();

  return (
    <footer className="border-t border-zinc-200/80 bg-gradient-to-b from-white/90 via-zinc-50/80 to-zinc-100/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.45)] sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20">
                <UtensilsCrossed className="size-4" />
              </span>
              <span className="text-sm font-bold text-zinc-900">RMS Restaurant</span>
            </div>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-zinc-600">
              Fresh ingredients, bold flavors, and warm hospitality — every single day.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Links</p>
            <div className="flex flex-col gap-2">
              {[
                { path: "/order/menu",          label: "Our Menu" },
                { path: "/order/table-booking", label: "Book a Table" },
                { path: "/order/about",         label: "About Us" },
                { path: "/order/contact",       label: "Contact" },
              ].map((l) => (
                <Link
                  key={l.path}
                  href={link(l.path)}
                  className="cursor-pointer text-sm text-zinc-600 transition-colors hover:text-emerald-700"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Opening Hours</p>
            <div className="space-y-1.5 text-sm text-zinc-600">
              <p>Mon – Fri: 11 AM – 10 PM</p>
              <p>Sat – Sun: 10 AM – 11 PM</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</p>
            <div className="space-y-2 text-sm text-zinc-600">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                <span>123 Restaurant St, Food City</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-emerald-600" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-emerald-600" />
                <span>hello@rmsrestaurant.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-200/80 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-500">© {new Date().getFullYear()} RMS Restaurant. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href={link("/order/table-booking")}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-emerald-500/40 hover:text-emerald-700"
            >
              <CalendarClock className="size-3.5" /> Book Table
            </Link>
            <Link
              href={link("/order/menu")}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
