"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import {
  resolveFooterAccountLinks,
  resolveFooterQuickLinks,
  resolveFooterSocialLinks,
  resolveTheme,
} from "@/lib/resolveLayoutTheme";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import { motion } from "framer-motion";
import {
  ArrowRight, CalendarClock, Mail, MapPin,
  Phone,
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

const SOCIAL_SVG_BY_ID = Object.fromEntries(SOCIAL.map((s) => [s.key, s.svg]));

export default function CustomerFooter() {
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const theme = resolveTheme(cms.theme);
  const footerCfg = theme.footer ?? {};
  const footerColors = footerCfg.colors ?? {};
  const quickLinks = resolveFooterQuickLinks(cms.theme);
  const accountLinks = resolveFooterAccountLinks(cms.theme);
  const socialLinks = resolveFooterSocialLinks(cms.theme, cms.social);
  const policyLinks = quickLinks.filter((l) =>
    ["/privacy", "/terms"].includes(l.path)
  );
  const mainQuickLinks = quickLinks.filter(
    (l) => !["/privacy", "/terms"].includes(l.path)
  );
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  const footerBg = footerColors.background?.trim() || "#111827";
  const footerFont = footerColors.font?.trim() || "#ffffff";
  const footerStyle = {
    backgroundColor: footerBg,
    color: footerFont,
    "--customer-footer-text": footerFont,
  };
  const copyrightLine =
    footerCfg.copyrightText?.trim() ||
    `© ${new Date().getFullYear()} ${info.name}. All rights reserved.`;

  return (
    <footer
      className="customer-site-footer border-t border-white/10"
      style={footerStyle}
    >

      {/* ── Main grid ── */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={link("/home")} className="inline-flex items-center min-w-0">
              <RestaurantLogo size="md" mode="dark" imageOnly className="max-w-[220px]" />
            </Link>
            {footerCfg.showDescription !== false && (
            <p className="ct-footer-muted mt-4 text-sm leading-relaxed">
              {footerCfg.tagline?.trim() ||
                cms.about?.description?.trim() ||
                "Fresh ingredients, bold flavors, and warm hospitality — every single day."}
            </p>
            )}

            {/* Social icons */}
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {socialLinks.map(({ id, label, href }) => (
                  <motion.a
                    key={id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{ y: -2, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="ct-footer-muted flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all hover:border-customer-primary/50 hover:bg-customer-primary/10 hover:text-customer-primary"
                  >
                    {SOCIAL_SVG_BY_ID[id] ?? <span className="text-[10px]">{label?.[0]}</span>}
                  </motion.a>
                ))}
              </div>
            )}

            {/* Need Help */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-bold" style={{ color: footerFont }}>
                {footerCfg.helpTitle?.trim() || "Need Help?"}
              </p>
              <p className="ct-footer-muted mt-1 text-xs">
                {footerCfg.helpSubtitle?.trim() || "We're here for you anytime."}
              </p>
              {info.phone && (
                <a href={`tel:${info.phone}`} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-customer-primary hover:underline">
                  <Phone className="size-3" /> {info.phone}
                </a>
              )}
              {info.email && (
                <a href={`mailto:${info.email}`} className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-customer-primary hover:underline">
                  <Mail className="size-3" /> {info.email}
                </a>
              )}
            </div>
          </div>

          {/* Opening Hours */}
          {footerCfg.showOpeningHours !== false && (
          <div>
            <p className="mb-5 font-poppins text-xs font-bold uppercase tracking-widest" style={{ color: footerFont }}>Opening Hours</p>
            <div className="space-y-2.5">
              {info.openingHours?.length > 0 ? (
                info.openingHours.map((h) => (
                  <div key={h.day} className="flex items-center justify-between text-sm">
                    <span className="ct-footer-muted">{h.day.slice(0, 3)}</span>
                    {h.closed ? (
                      <span className="text-xs font-semibold text-red-400">Closed</span>
                    ) : (
                      <span className="font-medium" style={{ color: footerFont }}>{h.openTime} – {h.closeTime}</span>
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
                      <span className="ct-footer-muted">{h.day}</span>
                      <span className="font-medium" style={{ color: footerFont }}>{h.time}</span>
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
          )}

          {/* My Account + Quick Links */}
          <div>
            {accountLinks.length > 0 && (
            <>
            <p className="mb-5 font-poppins text-xs font-bold uppercase tracking-widest" style={{ color: footerFont }}>My Account</p>
            <div className="flex flex-col gap-2.5">
              {accountLinks.map((l) => (
                <Link key={l.id ?? l.path} href={link(l.path)}
                  className="ct-footer-muted group flex items-center gap-1.5 text-sm transition-colors hover:text-customer-primary">
                  <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  {l.label}
                </Link>
              ))}
            </div>
            </>
            )}

            {mainQuickLinks.length > 0 && (
            <>
            <p className="mb-5 mt-8 font-poppins text-xs font-bold uppercase tracking-widest" style={{ color: footerFont }}>Quick Links</p>
            <div className="flex flex-col gap-2.5">
              {mainQuickLinks.map((l) => (
                <Link key={l.id ?? l.path} href={link(l.path)}
                  className="ct-footer-muted group flex items-center gap-1.5 text-sm transition-colors hover:text-customer-primary">
                  <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5" />
                  {l.label}
                </Link>
              ))}
            </div>
            </>
            )}
          </div>

          {/* Contact + Policy */}
          <div>
            <p className="mb-5 font-poppins text-xs font-bold uppercase tracking-widest" style={{ color: footerFont }}>Contact Us</p>
            <div className="space-y-3">
              {[
                { Icon: MapPin, text: info.address || "123 Restaurant St, Food City" },
                { Icon: Phone,  text: info.phone   || "+1 (555) 123-4567" },
                { Icon: Mail,   text: info.email   || "hello@restaurant.com" },
              ].map(({ Icon, text }) => (
                <div key={text} className="ct-footer-muted flex items-start gap-2.5 text-sm">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-customer-primary/15">
                    <Icon className="size-3.5 text-customer-primary" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>

            {policyLinks.length > 0 && (
            <>
            <p className="mb-4 mt-8 font-poppins text-xs font-bold uppercase tracking-widest" style={{ color: footerFont }}>Policies</p>
            <div className="flex flex-col gap-2">
              {policyLinks.map((l) => (
                <Link
                  key={l.id ?? l.path}
                  href={link(l.path)}
                  className="ct-footer-subtle text-xs transition-colors hover:text-customer-primary"
                >
                  {l.label}
                </Link>
              ))}
            </div>
            </>
            )}
          </div>
        </div>

        {footerCfg.showAppDownload && (footerCfg.appStoreUrl?.trim() || footerCfg.playStoreUrl?.trim()) && (
          <div className="mt-10 flex flex-wrap gap-3">
            {footerCfg.showAppleStore !== false && footerCfg.appStoreUrl?.trim() && (
              <a
                href={footerCfg.appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold hover:border-customer-primary/40"
              >
                App Store
              </a>
            )}
            {footerCfg.showPlayStore !== false && footerCfg.playStoreUrl?.trim() && (
              <a
                href={footerCfg.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold hover:border-customer-primary/40"
              >
                Google Play
              </a>
            )}
          </div>
        )}

        {/* ── Newsletter ── */}
        {footerCfg.showNewsletter !== false && (
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
          <div className="mb-4 sm:mb-0">
            <p className="font-poppins text-sm font-bold" style={{ color: footerFont }}>
              {footerCfg.newsletterTitle?.trim() || "Subscribe to our Newsletter"}
            </p>
            <p className="ct-footer-muted mt-1 text-xs">
              {footerCfg.newsletterSubtitle?.trim() ||
                "Stay up to date with our latest offers and new dishes."}
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={footerCfg.newsletterPlaceholder?.trim() || "Enter your email"}
              className="ct-footer-newsletter-input flex-1 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm outline-none focus:border-customer-primary/50"
              style={{ color: footerFont }}
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="min-h-[44px] w-full shrink-0 cursor-pointer rounded-xl gradient-primary px-4 py-2.5 text-xs font-bold text-white shadow-md sm:w-auto"
            >
              {subscribed ? "✓ Done!" : "Subscribe"}
            </motion.button>
          </form>
        </div>
        )}

        {/* ── Bottom bar ── */}
        {footerCfg.showCopyright !== false && (
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="ct-footer-subtle text-xs">{copyrightLine}</p>
            {footerCfg.copyrightNote?.trim() && (
              <p className="ct-footer-subtle mt-1 text-[11px]">{footerCfg.copyrightNote}</p>
            )}
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href={link("/order/table-booking")}
                className="ct-footer-muted inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold transition-all hover:border-customer-primary/40 hover:text-customer-primary">
                <CalendarClock className="size-3.5" /> Book Table
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link href={link("/order/menu")}
                className="inline-flex items-center gap-1.5 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-[var(--customer-primary-shadow)]/20 transition-all hover:shadow-lg">
                Order Now <ArrowRight className="size-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
        )}
      </div>
    </footer>
  );
}
