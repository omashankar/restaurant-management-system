"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { motion } from "framer-motion";
import {
  ArrowRight, CalendarClock, Mail, MapPin,
  Phone, UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const SOCIAL = [
  { key: "instagram", label: "Instagram", svg: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  { key: "facebook",  label: "Facebook",  svg: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { key: "twitter",   label: "Twitter",   svg: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
  { key: "whatsapp",  label: "WhatsApp",  svg: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { key: "youtube",   label: "YouTube",   svg: <svg viewBox="0 0 24 24" fill="currentColor" className="size-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
];

const QUICK_LINKS = [
  { path: "/order/menu",          label: "Our Menu" },
  { path: "/order/table-booking", label: "Book a Table" },
  { path: "/order/about",         label: "About Us" },
  { path: "/order/contact",       label: "Contact" },
];

const POLICY_LINKS = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms & Conditions" },
  { href: "#", label: "Refund Policy" },
  { href: "#", label: "Cancel Policy" },
  { href: "#", label: "FAQ" },
];

export default function CustomerFooter() {
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  const activeSocials = SOCIAL.filter(({ key }) => cms.social?.[key]);

  return (
    <footer className="border-t border-[#FFE4D6] bg-[#111827] text-white">

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={link("/home")} className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl gradient-primary shadow-md shadow-[#FF6B35]/30">
                {info.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.logoUrl} alt={info.name} className="size-8 rounded-lg object-cover" />
                ) : (
                  <UtensilsCrossed className="size-5 text-white" />
                )}
              </div>
              <span className="font-poppins text-base font-bold text-white">
                {info.name.split(" ").slice(0, -1).join(" ") || info.name}{" "}
                <span className="gradient-text">{info.name.split(" ").slice(-1)[0]}</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Fresh ingredients, bold flavors, and warm hospitality — every single day. We craft every dish with love.
            </p>

            {/* Social icons */}
            {activeSocials.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {activeSocials.map(({ key, label, svg }) => (
                  <motion.a
                    key={key}
                    href={cms.social[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ y: -2, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 transition-all hover:border-[#FF6B35]/50 hover:bg-[#FF6B35]/10 hover:text-[#FF6B35]"
                  >
                    {svg}
                  </motion.a>
                ))}
              </div>
            )}

            {/* Need Help */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold text-white">Need Help?</p>
              <p className="mt-1 text-xs text-zinc-400">We&apos;re here for you anytime.</p>
              {info.phone && (
                <a href={`tel:${info.phone}`} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#FF6B35] hover:underline">
                  <Phone className="size-3" /> {info.phone}
                </a>
              )}
              {info.email && (
                <a href={`mailto:${info.email}`} className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#FF6B35] hover:underline">
                  <Mail className="size-3" /> {info.email}
                </a>
              )}
            </div>
          </div>

          {/* Opening Hours */}
          <div>
            <p className="mb-5 font-poppins text-xs font-bold uppercase tracking-widest text-white">Opening Hours</p>
            <div className="space-y-2.5">
              {info.openingHours?.length > 0 ? (
                info.openingHours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">{h.day.slice(0, 3)}</span>
                    {h.closed ? (
                      <span className="text-xs font-semibold text-red-400">Closed</span>
                    ) : (
                      <span className="font-medium text-white">{h.openTime} – {h.closeTime}</span>
                    )}
                  </div>
                ))
              ) : (
                <>
                  {[
                    { day: "Mon – Fri", time: "11:00 AM – 10:00 PM" },
                    { day: "Saturday",  time: "10:00 AM – 11:00 PM" },
                    { day: "Sunday",    time: "10:00 AM – 09:00 PM" },
                  ].map((h) => (
                    <div key={h.day} className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{h.day}</span>
                      <span className="font-medium text-white">{h.time}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
            {/* Open/Closed indicator */}
            <div className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 ${info.isOpenToday ? "bg-[#22C55E]/10" : "bg-red-500/10"}`}>
              <span className={`size-2 rounded-full ${info.isOpenToday ? "animate-pulse bg-[#22C55E]" : "bg-red-400"}`} />
              <span className={`text-xs font-semibold ${info.isOpenToday ? "text-[#22C55E]" : "text-red-400"}`}>
                {info.isOpenToday ? `Open Now · ${info.todayLabel ?? ""}` : "Closed Today"}
              </span>
            </div>
          </div>

          {/* My Account + Quick Links */}
          <div>
            <p className="mb-5 font-poppins text-xs font-bold uppercase tracking-widest text-white">My Account</p>
            <div className="flex flex-col gap-2.5">
              {[
                { path: "/account/dashboard", label: "Profile" },
                { path: "/account/dashboard", label: "My Orders" },
                { path: "/order/table-booking", label: "Reservations" },
              ].map((l) => (
                <Link key={l.label} href={link(l.path)}
                  className="group flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-[#FF6B35]">
                  <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  {l.label}
                </Link>
              ))}
            </div>

            <p className="mb-5 mt-8 font-poppins text-xs font-bold uppercase tracking-widest text-white">Quick Links</p>
            <div className="flex flex-col gap-2.5">
              {QUICK_LINKS.map((l) => (
                <Link key={l.path} href={link(l.path)}
                  className="group flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-[#FF6B35]">
                  <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact + Policy */}
          <div>
            <p className="mb-5 font-poppins text-xs font-bold uppercase tracking-widest text-white">Contact Us</p>
            <div className="space-y-3">
              {[
                { Icon: MapPin, text: info.address || "123 Restaurant St, Food City" },
                { Icon: Phone,  text: info.phone   || "+1 (555) 123-4567" },
                { Icon: Mail,   text: info.email   || "hello@restaurant.com" },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-sm text-zinc-400">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FF6B35]/15">
                    <Icon className="size-3.5 text-[#FF6B35]" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            <p className="mb-4 mt-8 font-poppins text-xs font-bold uppercase tracking-widest text-white">Policies</p>
            <div className="flex flex-col gap-2">
              {POLICY_LINKS.map((l) => (
                <a key={l.label} href={l.href}
                  className="text-xs text-zinc-500 transition-colors hover:text-[#FF6B35]">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Newsletter ── */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="mb-4 sm:mb-0">
            <p className="font-poppins text-sm font-bold text-white">Subscribe to our Newsletter</p>
            <p className="mt-1 text-xs text-zinc-400">Stay up to date with our latest offers and new dishes.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full max-w-sm items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-[#FF6B35]/50"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="shrink-0 cursor-pointer rounded-xl gradient-primary px-4 py-2.5 text-xs font-bold text-white shadow-md"
            >
              {subscribed ? "✓ Done!" : "Subscribe"}
            </motion.button>
          </form>
        </div>

        {/* ── Bottom bar ── */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} <span className="text-white font-semibold">{info.name}</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href={link("/order/table-booking")}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35]">
                <CalendarClock className="size-3.5" /> Book Table
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href={link("/order/menu")}
                className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#FF6B35]/20 transition-all hover:shadow-lg">
                Order Now <ArrowRight className="size-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
