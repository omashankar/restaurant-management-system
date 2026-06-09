"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { useCustomerTheme } from "@/context/CustomerThemeContext";
import {
  resolveFooterAccountLinks,
  resolveFooterQuickLinks,
  resolveFooterSocialLinks,
  resolveTheme,
} from "@/lib/resolveLayoutTheme";
import RestaurantLogo from "@/components/customer/RestaurantLogo";
import SocialMediaIcons from "@/components/customer/SocialMediaIcons";
import { useCustomerMotion } from "@/hooks/useCustomerMotion";
import { motion } from "framer-motion";
import {
  ArrowRight, CalendarClock, Mail, MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { customerClasses } from "@/lib/customerTheme";
import { luminance } from "@/theme/palette";
import { useState } from "react";

export default function CustomerFooter() {
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const { isDark } = useCustomerTheme();
  const motionFx = useCustomerMotion();
  const theme = resolveTheme(cms.theme);
  const footerCfg = theme.footer ?? {};
  const footerColors = footerCfg.colors ?? {};
  const quickLinks = resolveFooterQuickLinks(cms.theme);
  const accountLinks = resolveFooterAccountLinks(cms.theme);
  const socialLinks = resolveFooterSocialLinks(cms.theme, cms.social);
  const POLICY_PATHS = ["/privacy", "/terms", "/order/privacy", "/order/terms"];
  const policyLinks = quickLinks.filter((l) => POLICY_PATHS.includes(l.path));
  const mainQuickLinks = quickLinks.filter((l) => !POLICY_PATHS.includes(l.path));
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setSubscribing(true);
    setSubscribeError("");
    try {
      const res = await fetch("/api/customer/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubscribeError(data.error ?? "Could not subscribe.");
        return;
      }
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    } catch {
      setSubscribeError("Network error. Please try again.");
    } finally {
      setSubscribing(false);
    }
  };

  const cmsBg = footerColors.background?.trim();
  const cmsFont = footerColors.font?.trim();
  const cmsFooterIsDark =
    Boolean(cmsBg) && luminance(cmsBg) <= 0.55;

  /** CMS footer colors apply in light mode only — dark mode uses theme tokens */
  const footerVarStyle =
    !isDark && (cmsBg || cmsFont)
      ? {
          ...(cmsBg ? { "--customer-footer-bg": cmsBg } : {}),
          ...(cmsFont
            ? {
                "--customer-footer-text": cmsFont,
                "--customer-footer-muted": cmsFont,
              }
            : cmsFooterIsDark
              ? {
                  "--customer-footer-text": "#ffffff",
                  "--customer-footer-muted": "rgba(255, 255, 255, 0.72)",
                  "--customer-footer-subtle": "rgba(255, 255, 255, 0.55)",
                  "--customer-footer-border": "rgba(255, 255, 255, 0.14)",
                }
              : {}),
        }
      : undefined;

  const copyrightLine =
    footerCfg.copyrightText?.trim() ||
    `© ${new Date().getFullYear()} ${info.name}. All rights reserved.`;

  const footerBgForLogo = isDark
    ? "#121214"
    : cmsBg || "#ffffff";
  const footerLogoMode = luminance(footerBgForLogo) > 0.55 ? "light" : "dark";
  const footerTone = luminance(footerBgForLogo) > 0.55 ? "light" : "dark";

  return (
    <footer
      className="customer-site-footer"
      data-footer-mode={isDark ? "dark" : "light"}
      data-footer-tone={footerTone}
      style={footerVarStyle}
    >

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={link("/home")} className="inline-flex min-w-0 items-center">
              <RestaurantLogo size="lg" mode={footerLogoMode} imageOnly />
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

            <div className="ct-footer-panel mt-6 p-4">
              <p className="ct-footer-heading text-xs font-bold">
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
              <p className="ct-footer-heading mb-5 font-poppins text-xs font-bold uppercase tracking-widest">
                Opening Hours
              </p>
              <div className="space-y-2.5">
                {info.openingHours?.length > 0 ? (
                  info.openingHours.map((h) => (
                    <div key={h.day} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="ct-footer-muted">{h.day.slice(0, 3)}</span>
                      {h.closed ? (
                        <span className="text-xs font-semibold text-[color-mix(in_srgb,#ef4444_85%,var(--customer-footer-text))]">Closed</span>
                      ) : (
                        <span className="ct-footer-heading font-medium sm:text-right">{h.openTime} – {h.closeTime}</span>
                      )}
                    </div>
                  ))
                ) : (
                  [
                    { day: "Mon – Fri", time: "11:00 AM – 10:00 PM" },
                    { day: "Saturday", time: "10:00 AM – 11:00 PM" },
                    { day: "Sunday", time: "10:00 AM – 09:00 PM" },
                  ].map((h) => (
                    <div key={h.day} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="ct-footer-muted">{h.day}</span>
                      <span className="ct-footer-heading font-medium sm:text-right">{h.time}</span>
                    </div>
                  ))
                )}
              </div>
              <div
                className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5 ${
                  info.isOpenToday ? "ct-footer-status-open" : "ct-footer-status-closed"
                }`}
              >
                <span className={`size-2 ${info.isOpenToday ? `${customerClasses.statusDotOpen} animate-pulse` : customerClasses.statusDotClosed}`} />
                <span className="text-xs font-semibold">
                  {info.isOpenToday ? `Open Now · ${info.todayLabel ?? ""}` : "Closed Today"}
                </span>
              </div>
            </div>
          )}

          {/* My Account + Quick Links */}
          <div>
            {accountLinks.length > 0 && (
              <>
                <p className="ct-footer-heading mb-5 font-poppins text-xs font-bold uppercase tracking-widest">
                  My Account
                </p>
                <div className="flex flex-col gap-2.5">
                  {accountLinks.map((l) => (
                    <Link
                      key={l.id ?? l.path}
                      href={link(l.path)}
                      className="ct-footer-muted group flex items-center gap-1.5 text-sm transition-colors hover:text-customer-primary"
                    >
                      <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              </>
            )}

            {mainQuickLinks.length > 0 && (
              <>
                <p className="ct-footer-heading mb-5 mt-8 font-poppins text-xs font-bold uppercase tracking-widest">
                  Quick Links
                </p>
                <div className="flex flex-col gap-2.5">
                  {mainQuickLinks.map((l) => (
                    <Link
                      key={l.id ?? l.path}
                      href={link(l.path)}
                      className="ct-footer-muted group flex items-center gap-1.5 text-sm transition-colors hover:text-customer-primary"
                    >
                      <ArrowRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                      {l.label}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Contact + Policy */}
          <div>
            <p className="ct-footer-heading mb-5 font-poppins text-xs font-bold uppercase tracking-widest">
              Contact Us
            </p>
            <div className="space-y-3">
              {[
                { Icon: MapPin, text: info.address || "Address not set" },
                { Icon: Phone, text: info.phone || "Phone not set" },
                { Icon: Mail, text: info.email || "Email not set" },
              ].map(({ Icon, text }) => (
                <div key={text} className="ct-footer-muted flex items-start gap-2.5 text-sm">
                  <div className="ct-footer-contact-icon mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-3.5 text-customer-primary" />
                  </div>
                  <span className="min-w-0 break-words">{text}</span>
                </div>
              ))}
            </div>

            {policyLinks.length > 0 && (
              <>
                <p className="ct-footer-heading mb-4 mt-8 font-poppins text-xs font-bold uppercase tracking-widest">
                  Policies
                </p>
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
                className="ct-footer-panel ct-footer-muted rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:text-customer-primary"
              >
                App Store
              </a>
            )}
            {footerCfg.showPlayStore !== false && footerCfg.playStoreUrl?.trim() && (
              <a
                href={footerCfg.playStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ct-footer-panel ct-footer-muted rounded-xl px-4 py-2 text-xs font-semibold transition-colors hover:text-customer-primary"
              >
                Google Play
              </a>
            )}
          </div>
        )}

        {footerCfg.showNewsletter !== false && (
          <div className="ct-footer-panel mt-12 px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
            <div className="mb-4 sm:mb-0">
              <p className="ct-footer-heading font-poppins text-sm font-bold">
                {footerCfg.newsletterTitle?.trim() || "Subscribe to our Newsletter"}
              </p>
              <p className="ct-footer-muted mt-1 text-xs">
                {footerCfg.newsletterSubtitle?.trim() ||
                  "Stay up to date with our latest offers and new dishes."}
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="customer-newsletter-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={footerCfg.newsletterPlaceholder?.trim() || "Enter your email"}
                autoComplete="email"
                className="ct-footer-newsletter-input flex-1 rounded-xl border px-4 py-2.5 text-sm outline-none"
              />
              <motion.button
                whileHover={motionFx.hoverBtn}
                whileTap={motionFx.tap}
                type="submit"
                disabled={subscribing}
                className="ct-btn ct-btn-primary min-h-[44px] w-full shrink-0 cursor-pointer px-5 py-2.5 text-xs font-bold disabled:opacity-60 sm:w-auto"
              >
                {subscribing ? "…" : subscribed ? "✓ Done!" : "Subscribe"}
              </motion.button>
              {subscribeError && (
                <p className={`w-full sm:col-span-2 ${customerClasses.alertError}`}>{subscribeError}</p>
              )}
            </form>
          </div>
        )}

        {footerCfg.showCopyright !== false && (
          <div className="ct-footer-divider mt-10 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="ct-footer-subtle text-xs">{copyrightLine}</p>
              {footerCfg.copyrightNote?.trim() && (
                <p className="ct-footer-subtle mt-1 text-[11px]">{footerCfg.copyrightNote}</p>
              )}
            </div>
            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Link
                href={link("/order/table-booking")}
                className="ct-footer-panel ct-footer-muted inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold transition-colors hover:border-[var(--customer-primary-border)] hover:text-customer-primary"
              >
                <CalendarClock className="size-3.5" /> Book Table
              </Link>
              <Link
                href={link("/order/menu")}
                className="ct-btn ct-btn-primary inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-bold"
              >
                Order Now <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}
