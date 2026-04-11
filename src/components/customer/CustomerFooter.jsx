import { CalendarClock, Mail, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

export default function CustomerFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
                <UtensilsCrossed className="size-4" />
              </span>
              <span className="text-sm font-bold text-zinc-100">RMS Restaurant</span>
            </div>
            <p className="mt-3 text-xs text-zinc-500 leading-relaxed">
              Fresh ingredients, bold flavors, and warm hospitality — every single day.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Quick Links</p>
            <div className="flex flex-col gap-2">
              {[
                { href: "/order/menu",          label: "Our Menu" },
                { href: "/order/table-booking", label: "Book a Table" },
                { href: "/order/about",         label: "About Us" },
                { href: "/order/contact",       label: "Contact" },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="cursor-pointer text-sm text-zinc-400 transition-colors hover:text-emerald-400">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Opening Hours</p>
            <div className="space-y-1.5 text-sm text-zinc-400">
              <p>Mon – Fri: 11 AM – 10 PM</p>
              <p>Sat – Sun: 10 AM – 11 PM</p>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</p>
            <div className="space-y-2 text-sm text-zinc-400">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-emerald-400" /><span>123 Restaurant St, Food City</span></div>
              <div className="flex items-center gap-2"><Phone className="size-3.5 shrink-0 text-emerald-400" /><span>+1 (555) 123-4567</span></div>
              <div className="flex items-center gap-2"><Mail className="size-3.5 shrink-0 text-emerald-400" /><span>hello@rmsrestaurant.com</span></div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-zinc-800 pt-6 sm:flex-row">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} RMS Restaurant. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/order/table-booking" className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-emerald-500/40 hover:text-emerald-400">
              <CalendarClock className="size-3.5" /> Book Table
            </Link>
            <Link href="/order/menu" className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 transition-colors hover:bg-emerald-400">
              Order Now
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
