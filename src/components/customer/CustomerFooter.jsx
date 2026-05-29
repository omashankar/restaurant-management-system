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
import SocialMediaIcons from "@/components/customer/SocialMediaIcons";
import { motion } from "framer-motion";
import {
  ArrowRight, CalendarClock, Mail, MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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
              <RestaurantLogo size="lg" mode="dark" imageOnly />
            </Link>
            {footerCfg.showDescription !== false && (
            <p className="ct-footer-muted mt-4 text-sm leading-relaxed">
              {footerCfg.tagline?.trim() ||
                cms.about?.description?.trim() ||
                "Fresh ingredients, bold flavors, and warm hospitality — every single day."}
            </p>
            )}

            {socialLinks.length > 0 && (
              <SocialMediaIcons links={socialLinks} variant="footer" className="mt-5" />
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
