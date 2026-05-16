"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { motion } from "framer-motion";
import { CalendarClock, Mail, MapPin, Phone, UtensilsCrossed, ArrowRight, Share2, MessageCircle, Heart } from "lucide-react";
import Link from "next/link";

export default function CustomerFooter() {
  const { link } = useRestaurantSlug();

  return (
    <footer className="border-t border-[#FFE4D6] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Top grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={link("/home")} className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-[#FF6B35]/20">
                <UtensilsCrossed className="size-5 text-white" />
              </div>
              <span className="font-poppins text-base font-bold text-[#111827]">
                RMS <span className="gradient-text">Restaurant</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">
              Fresh ingredients, bold flavors, and warm hospitality — every single day.
            </p>
            {/* Social */}
            <div className="mt-5 flex gap-2">
              {[Share2, MessageCircle, Heart].map((Icon, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -2, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  className="flex size-9 items-center justify-center rounded-xl border border-[#FFE4D6] bg-white text-[#6B7280] transition-colors hover:border-[#FF6B35]/40 hover:text-[#FF6B35]"
                >
                  <Icon className="size-4" />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-widest text-[#111827]">Quick Links</p>
            <div className="flex flex-col gap-2.5">
              {[
                { path: "/order/menu",          label: "Our Menu" },
                { path: "/order/table-booking", label: "Book a Table" },
                { path: "/order/about",         label: "About Us" },
                { path: "/order/contact",       label: "Contact" },
              ].map((l) => (
                <Link
                  key={l.path}
                  href={link(l.path)}
                  className="group flex items-center gap-1.5 text-sm text-[#6B7280] transition-colors hover:text-[#FF6B35]"
                >
                  <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div>
            <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-widest text-[#111827]">Opening Hours</p>
            <div className="space-y-2 text-sm text-[#6B7280]">
              <div className="flex items-center justify-between">
                <span>Mon – Fri</span>
                <span className="font-medium text-[#111827]">11 AM – 10 PM</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sat – Sun</span>
                <span className="font-medium text-[#111827]">10 AM – 11 PM</span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#22C55E]/10 px-3 py-2">
                <span className="size-2 rounded-full bg-[#22C55E] animate-pulse" />
                <span className="text-xs font-semibold text-[#22C55E]">Open Now</span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-4 font-poppins text-xs font-bold uppercase tracking-widest text-[#111827]">Contact Us</p>
            <div className="space-y-3">
              {[
                { Icon: MapPin, text: "123 Restaurant St, Food City" },
                { Icon: Phone,  text: "+1 (555) 123-4567" },
                { Icon: Mail,   text: "hello@rmsrestaurant.com" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-sm text-[#6B7280]">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FF6B35]/10">
                    <Icon className="size-3.5 text-[#FF6B35]" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#FFE4D6] pt-8 sm:flex-row">
          <p className="text-xs text-[#6B7280]">
            © {new Date().getFullYear()} RMS Restaurant. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={link("/order/table-booking")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFE4D6] bg-white px-4 py-2 text-xs font-semibold text-[#111827] transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35]"
              >
                <CalendarClock className="size-3.5" /> Book Table
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={link("/order/menu")}
                className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#FF6B35]/20 transition-all hover:shadow-lg"
              >
                Order Now <ArrowRight className="size-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
