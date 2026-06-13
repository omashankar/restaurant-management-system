"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import SocialMediaIcons from "@/components/customer/SocialMediaIcons";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { resolveSiteSocialLinks } from "@/lib/resolveLayoutTheme";
import { useCustomerLocale } from "@/context/CustomerLocaleContext";
import {
  customerClasses,
  customerOverlay,
  customerPage,
  customerSectionBg,
  customerType,
} from "@/lib/customerTheme";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

const MISSING_HINT = "Not set yet";

function telHref(phone) {
  const digits = String(phone ?? "").replace(/[^\d+]/g, "");
  return digits ? `tel:${digits}` : "";
}

function CardHeader({ Icon, iconClass, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="size-6" aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0">
        <h2 className="font-poppins text-xl font-black text-customer-text">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-relaxed text-customer-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function ContactInfoArticle({ Icon, label, value, color, href, mapsHref }) {
  const isMissing = !value || value === MISSING_HINT;

  return (
    <>
      <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
        <Icon className="size-6" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-customer-muted">{label}</p>
        {href && !isMissing ? (
          <a
            href={href}
            className="mt-1 block text-sm font-semibold leading-snug text-customer-primary underline-offset-2 break-words hover:underline"
          >
            {value}
          </a>
        ) : (
          <p
            className={`mt-1 text-sm font-semibold leading-snug break-words ${
              isMissing ? "text-customer-muted" : "text-customer-text"
            }`}
          >
            {value || MISSING_HINT}
          </p>
        )}
        {label === "Address" && mapsHref && !isMissing ? (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs font-semibold text-customer-primary underline-offset-2 hover:underline"
          >
            Open in Maps
          </a>
        ) : null}
      </div>
    </>
  );
}

function OpeningHoursList({ hours, hoursSummary, todayName, formatHoursRange }) {
  if (hours?.length > 0) {
    return (
      <ul className="space-y-2">
        {hours.map((h) => {
          const isToday = h.day === todayName;
          return (
            <li
              key={h.day}
              className={`flex flex-col gap-0.5 rounded-xl px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between ${
                isToday
                  ? "bg-[color-mix(in_srgb,var(--customer-primary)_10%,var(--customer-elevated))] ring-1 ring-[var(--customer-primary-border)]"
                  : "bg-[var(--customer-elevated)]"
              }`}
            >
              <span className={`text-sm font-semibold ${isToday ? "text-customer-primary" : "text-customer-text"}`}>
                {h.day}
                {isToday ? (
                  <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-customer-primary">
                    Today
                  </span>
                ) : null}
              </span>
              {h.closed ? (
                <span className={`text-xs font-bold ${customerClasses.textDanger}`}>Closed</span>
              ) : (
                <span className="text-sm font-bold tabular-nums text-customer-text sm:text-right">
                  {formatHoursRange(h.openTime, h.closeTime)}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  if (hoursSummary?.trim()) {
    return (
      <p className="rounded-xl bg-[var(--customer-elevated)] px-4 py-3 text-sm font-semibold leading-relaxed text-customer-text">
        {hoursSummary.trim()}
      </p>
    );
  }

  return <p className="text-sm text-customer-muted">Opening hours will be posted soon.</p>;
}

export default function ContactPage() {
  const { link } = useRestaurantSlug();
  const { info, loading } = useRestaurantInfo();
  const { formatTimeSlot, formatWeekdayLong } = useCustomerLocale();
  const formatHoursRange = (open, close) => {
    if (!open || !close) return "—";
    return `${formatTimeSlot(open)} – ${formatTimeSlot(close)}`;
  };
  const { content: cms } = useRestaurantCms();
  const contactCms = mergeCmsSection(DEFAULTS.contact, cms.contact);
  const socialLinks = resolveSiteSocialLinks(cms.theme, cms.social);

  const todayName = useMemo(() => formatWeekdayLong(), [formatWeekdayLong]);

  const todayHours = info.openingHours?.find((h) => h.day === todayName);
  const todayStatusLabel = info.isOpenToday && todayHours && !todayHours.closed
    ? `Open now · ${formatHoursRange(todayHours.openTime, todayHours.closeTime)}`
    : info.isOpenToday
      ? `Open now · ${info.todayLabel ?? ""}`
      : "Closed today";

  const address = info.address?.trim() || "";
  const phone = info.phone?.trim() || "";
  const email = info.email?.trim() || "";
  const mapsHref = info.googleMapsLink?.trim() || "";

  const contactRows = [
    {
      Icon: MapPin,
      label: "Address",
      value: address || MISSING_HINT,
      color: customerClasses.iconTintPrimary,
      mapsHref: mapsHref || undefined,
    },
    {
      Icon: Phone,
      label: "Phone",
      value: phone || MISSING_HINT,
      color: customerClasses.iconTintSuccess,
      href: telHref(phone) || undefined,
    },
    {
      Icon: Mail,
      label: "Email",
      value: email || MISSING_HINT,
      color: customerClasses.iconTintInfo,
      href: email ? `mailto:${email}` : undefined,
    },
  ];

  const panelMotion = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="ct-page-shell">

      <section className="ct-page-header">
        <div className={`${customerPage.headerInner} py-12 sm:py-14`}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className={customerClasses.badge}>
              {contactCms.eyebrow?.trim() || "Get in Touch"}
            </span>
            <h1 className={`${customerType.heroTitle} sm:text-5xl`}>
              {contactCms.title?.trim() || "Contact Us"}
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-customer-muted sm:text-base">
              {contactCms.subtitle?.trim() ||
                "Call, email, or visit us — we're here for orders, table bookings, and any questions."}
            </p>
          </motion.div>
        </div>
      </section>

      <section className={`${customerSectionBg.warm} ${customerClasses.sectionPad}`}>
        <div className={`${customerClasses.container} mx-auto max-w-5xl`}>
          <div
            className={`grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8 ${loading ? "opacity-70" : ""}`}
            aria-busy={loading}
          >
            <div className="flex flex-col gap-4 lg:gap-5">
              <header>
                <h2 className="font-poppins text-xl font-black text-customer-text">
                  {contactCms.detailsTitle?.trim() || "Contact details"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-customer-muted">
                  {contactCms.detailsSubtitle?.trim() ||
                    "Address, phone, and email for orders and support."}
                </p>
              </header>

              {contactRows.map((row, i) => (
                <motion.article
                  key={row.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  aria-label={`${row.label}: ${row.value}`}
                  className="ct-contact-detail-tile ct-surface-card flex items-start gap-4 rounded-2xl p-5 sm:p-6"
                >
                  <ContactInfoArticle {...row} />
                </motion.article>
              ))}

              {socialLinks.length > 0 ? (
                <div className="mt-2 rounded-2xl border border-customer-border bg-[var(--customer-card)] px-5 py-5 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-customer-muted">
                    {contactCms.socialLabel?.trim() || "Follow us on social media"}
                  </p>
                  <SocialMediaIcons links={socialLinks} variant="inline" className="mt-4" />
                </div>
              ) : null}
            </div>

            <motion.article
              {...panelMotion}
              transition={{ delay: 0.06 }}
              aria-label={contactCms.hoursTitle?.trim() || "Opening Hours"}
              className="ct-surface-card flex w-full flex-col rounded-3xl p-5 sm:p-8 lg:sticky lg:top-24"
            >
              <CardHeader
                Icon={Clock}
                iconClass={customerClasses.iconTintWarning}
                title={contactCms.hoursTitle?.trim() || "Opening Hours"}
                subtitle={
                  contactCms.hoursSubtitle?.trim() || "Plan your visit or pickup time"
                }
              />

              <div
                className={`mt-5 inline-flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 sm:w-auto ${
                  info.isOpenToday ? customerClasses.alertSuccess : customerClasses.alertError
                }`}
              >
                <span
                  className={`size-2.5 shrink-0 rounded-full ${
                    info.isOpenToday
                      ? `${customerClasses.statusDotOpen} animate-pulse`
                      : customerClasses.statusDotClosed
                  }`}
                />
                <span className="text-sm font-bold">{todayStatusLabel}</span>
              </div>

              <div className="mt-6 flex-1">
                <OpeningHoursList
                  hours={info.openingHours}
                  hoursSummary={info.hoursSummary}
                  todayName={todayName}
                  formatHoursRange={formatHoursRange}
                />
              </div>
            </motion.article>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mt-8 overflow-hidden rounded-3xl gradient-primary px-5 py-10 text-center sm:mt-10 sm:px-8 sm:py-12"
          >
            <div className="pointer-events-none absolute inset-0" aria-hidden>
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            <h2 className={`relative ${customerOverlay.title} font-poppins text-xl font-black sm:text-2xl`}>
              {contactCms.ctaTitle?.trim() || "Ready to order?"}
            </h2>
            <p className={`relative mx-auto mt-2 max-w-md text-sm ${customerOverlay.subtitle}`}>
              {contactCms.ctaSubtitle?.trim() ||
                "Browse the menu and get your favourites delivered or ready for pickup."}
            </p>
            <Link
              href={link("/order/menu")}
              className="relative mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-customer-primary transition-transform hover:scale-105"
            >
              {contactCms.ctaButtonLabel?.trim() || "View menu"} <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
