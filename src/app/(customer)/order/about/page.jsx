"use client";

import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import {
  DEFAULT_ABOUT_MAIN_IMAGE,
  DEFAULT_ABOUT_SIDE_IMAGE,
  DEFAULTS,
} from "@/lib/restaurantCmsDefaults";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { motion, useInView } from "framer-motion";
import {
  Clock,
  MapPin,
  Phone,
  Award,
  Zap,
  Heart,
  ArrowRight,
  ChefHat,
  Star,
  Users,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import {
  customerClasses,
  customerMotion,
  customerPage,
  customerOverlay,
  customerSectionBg,
  customerType,
} from "@/lib/customerTheme";

const fadeUp = customerMotion.fadeUp;
const stagger = customerMotion.stagger;

const STAT_ICONS = [ChefHat, Star, Users, Award];

const DEFAULT_PROMISES = [
  "Fresh ingredients every day",
  "No artificial preservatives",
  "Locally sourced produce",
  "Hygienic kitchen standards",
  "Friendly & fast service",
  "Dine-in, Takeaway & Delivery",
];

const FEATURE_ICONS = [Award, Zap, Heart];

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function resolveAboutHref(path, linkFn) {
  const p = path?.trim();
  if (!p) return linkFn("/order/menu");
  if (p.startsWith("http")) return p;
  return linkFn(p.startsWith("/") ? p : `/${p}`);
}

export default function AboutPage() {
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const about = mergeCmsSection(DEFAULTS.about, cms.about);
  const fh = about.featuresHeader ?? {};
  const featuresH = {
    badge: fh.badge?.trim() || "Why Choose Us",
    title: fh.title?.trim() || "What Makes Us Special",
    subtitle: fh.subtitle?.trim() || "We go above and beyond to make every visit memorable.",
  };
  const visitH = {
    badge: about.visitHeader?.badge?.trim() || "Find Us",
    title: about.visitHeader?.title?.trim() || "Visit Us",
    subtitle: about.visitHeader?.subtitle?.trim() || "",
  };
  const features = (about.features ?? []).map((f, i) => ({
    ...f,
    icon: FEATURE_ICONS[i] ?? Award,
  }));
  const bottomCta = about.bottomCta ?? {};

  const stats = (about.stats?.length > 0 ? about.stats : []).map((s, i) => ({
    ...s,
    icon: STAT_ICONS[i] ?? Award,
  }));

  const promises =
    Array.isArray(about.promises) && about.promises.length > 0
      ? about.promises
      : DEFAULT_PROMISES;

  const mainImage = normalizeLogoSrc(about.imageUrl) || DEFAULT_ABOUT_MAIN_IMAGE;
  const sideImages = (Array.isArray(about.sideImages) ? about.sideImages : [])
    .map((img) => normalizeLogoSrc(img?.imageUrl))
    .filter(Boolean)
    .slice(0, 3);

  const primaryHref = resolveAboutHref(about.ctaPrimaryLink, link);
  const secondaryHref = resolveAboutHref(about.ctaSecondaryLink, link);

  const missingHint = "Add in Settings → Contact";

  return (
    <div className="ct-page-shell">
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-customer-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-customer-primary">
                {about.headline?.trim() || "Our Story"}
              </span>
              <h1 className="font-poppins text-4xl font-black leading-tight text-customer-text sm:text-5xl">
                About <span className="gradient-text">{info.name}</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-customer-muted">
                {about.description?.trim() ||
                  "We started with a simple mission — to serve fresh, delicious food with warm hospitality."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                {promises.map((p) => (
                  <div key={p} className="flex items-center gap-2 text-sm text-customer-muted">
                    <CheckCircle2 className="size-4 shrink-0 text-customer-primary" />
                    {p}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[var(--customer-primary-shadow)]/25 transition-all hover:scale-105"
                >
                  {about.ctaPrimaryLabel?.trim() || "View Menu"} <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-customer-border bg-white px-7 py-3.5 text-sm font-bold text-customer-text transition-all hover:border-customer-primary/40"
                >
                  {about.ctaSecondaryLabel?.trim() || "Book a Table"}
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="col-span-2 overflow-hidden rounded-3xl shadow-lg">
                <img
                  src={mainImage}
                  alt={info.name || "Restaurant"}
                  className="h-56 w-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    e.target.src = DEFAULT_ABOUT_MAIN_IMAGE;
                  }}
                />
              </div>
              {(sideImages.length > 0
                ? sideImages
                : [DEFAULT_ABOUT_SIDE_IMAGE, DEFAULT_ABOUT_SIDE_IMAGE, DEFAULT_ABOUT_SIDE_IMAGE]
              ).map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className={`overflow-hidden rounded-2xl shadow-md ${i === 2 ? "col-span-2" : ""}`}
                >
                  <img
                    src={src}
                    alt=""
                    className={`w-full object-cover transition-transform duration-500 hover:scale-105 ${i === 2 ? "h-36" : "h-36"}`}
                    onError={(e) => {
                      e.target.src = DEFAULT_ABOUT_SIDE_IMAGE;
                    }}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {stats.length > 0 && (
        <section className="ct-dark-band bg-[var(--customer-footer-bg,#111827)] py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="grid grid-cols-2 gap-5 sm:grid-cols-3">
              {stats.map(({ value, label, icon: Icon }) => (
                <motion.div key={label} variants={fadeUp} className="text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-customer-primary/15">
                    <Icon className="size-6 text-customer-primary" />
                  </div>
                  <p className="ct-dark-band__value font-poppins text-3xl font-black">{value}</p>
                  <p className="ct-dark-band__label mt-1 text-xs font-semibold uppercase tracking-wider">
                    {label}
                  </p>
                </motion.div>
              ))}
            </AnimatedSection>
          </div>
        </section>
      )}

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              {featuresH.badge && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-customer-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-customer-primary">
                  {featuresH.badge}
                </span>
              )}
              <h2 className="font-poppins text-3xl font-black text-customer-text sm:text-4xl">{featuresH.title}</h2>
              {featuresH.subtitle && <p className="mt-3 text-sm text-customer-muted">{featuresH.subtitle}</p>}
            </motion.div>
            <div className="grid gap-6 sm:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="group rounded-3xl border border-customer-border bg-white p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-[var(--customer-primary-shadow)]/8"
                >
                  <div className="mb-5 flex size-14 items-center justify-center rounded-2xl gradient-primary shadow-md shadow-[var(--customer-primary-shadow)]/20 transition-transform group-hover:scale-110">
                    <Icon className="size-7 text-white" />
                  </div>
                  <h3 className="font-poppins text-lg font-black text-customer-text">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-customer-muted">{description}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className={`${customerSectionBg.warm} ${customerClasses.sectionPad}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-12 text-center">
              {visitH.badge && (
                <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-customer-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-customer-primary">
                  {visitH.badge}
                </span>
              )}
              <h2 className="font-poppins text-3xl font-black text-customer-text sm:text-4xl">{visitH.title}</h2>
              {visitH.subtitle && <p className="mt-3 text-sm text-customer-muted">{visitH.subtitle}</p>}
            </motion.div>
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  Icon: MapPin,
                  label: "Address",
                  value: info.address?.trim() || missingHint,
                  color: "bg-customer-primary/10 text-customer-primary",
                },
                {
                  Icon: Phone,
                  label: "Phone",
                  value: info.phone?.trim() || missingHint,
                  color: "bg-green-100 text-green-600",
                },
                {
                  Icon: Clock,
                  label: "Hours",
                  value: info.hoursSummary?.trim() || missingHint,
                  color: "bg-amber-100 text-amber-600",
                },
              ].map(({ Icon, label, value, color }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="flex items-start gap-4 ct-surface-card rounded-3xl p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                    <Icon className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-customer-muted">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-customer-text">{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl gradient-primary px-8 py-14 text-center shadow-2xl shadow-[var(--customer-primary-shadow)]/20"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            <h3 className="relative font-poppins text-3xl font-black text-white sm:text-4xl">
              {bottomCta.title?.trim() || "Ready to Taste the Difference?"}
            </h3>
            <p className={`relative mt-3 text-sm ${customerOverlay.subtitle}`}>
              {bottomCta.subtitle?.trim() || "Order online or visit us — we're always ready to serve you."}
            </p>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={resolveAboutHref(bottomCta.primaryLink, link)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-customer-primary shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                {bottomCta.primaryLabel?.trim() || "Order Now"} <ArrowRight className="size-4" />
              </Link>
              <Link
                href={resolveAboutHref(bottomCta.secondaryLink, link)}
                className={`inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold transition-all hover:bg-white/25 ${customerOverlay.glassPill}`}
              >
                {bottomCta.secondaryLabel?.trim() || "Contact Us"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
