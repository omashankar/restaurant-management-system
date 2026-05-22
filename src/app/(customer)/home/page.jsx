"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import SafeDishImage from "@/components/customer/SafeDishImage";
import FoodTypeIndicator from "@/components/customer/FoodTypeIndicator";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { CUSTOMER_HOME_CATEGORIES, CUSTOMER_HOME_REVIEWS, CUSTOMER_HOME_STEPS, CUSTOMER_ORDER_TYPES } from "@/config/customerContent";
import { motion, useInView } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ArrowRight, BarChart3, Bike, CalendarClock, ChefHat,
  ChevronRight, Clock, ConciergeBell, CreditCard, LayoutGrid,
  PackageSearch, Plus, Search, Star, Store, Zap, Flame, Award, TrendingUp
} from "lucide-react";import Link from "next/link";
import { useRouter } from "next/navigation";

/* ── Animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const STEP_ICON_MAP = {
  "layout-grid": LayoutGrid, "credit-card": CreditCard,
  "package-search": PackageSearch, "chef-hat": ChefHat, "bar-chart-3": BarChart3,
};

const ORDER_TYPE_UI = {
  "dine-in":  { Icon: Store,        bg: "from-orange-50 to-orange-100/50",  border: "border-orange-200", accent: "text-[#FF6B35]", iconBg: "bg-[#FF6B35]" },
  takeaway:   { Icon: ConciergeBell, bg: "from-amber-50 to-amber-100/50",   border: "border-amber-200",  accent: "text-amber-600",  iconBg: "bg-amber-500" },
  delivery:   { Icon: Bike,          bg: "from-rose-50 to-rose-100/50",     border: "border-rose-200",   accent: "text-rose-600",   iconBg: "bg-rose-500" },
};

function SectionHeader({ badge, title, subtitle }) {
  return (
    <motion.div variants={fadeUp} className="mb-10 text-center">
      {badge && (
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#FFE4D6] bg-[#FF6B35]/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">
          {badge}
        </span>
      )}
      <h2 className="font-poppins text-2xl font-bold tracking-tight text-[#111827] sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-sm text-[#6B7280] sm:text-base">{subtitle}</p>}
    </motion.div>
  );
}

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
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

/* ── Promo Banner Slider ── */
function PromoBannerSlider({ banners, link }) {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  const next = useCallback(() => {
    setActive((p) => (p + 1) % banners.length);
    setAnimKey((k) => k + 1);
  }, [banners.length]);

  const prev = () => {
    setActive((p) => (p - 1 + banners.length) % banners.length);
    setAnimKey((k) => k + 1);
  };

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  };

  const b = banners[active];

  return (
    <div className="relative overflow-hidden rounded-3xl shadow-2xl">
      {/* Background images — all preloaded, only active visible */}
      {banners.map((ban, i) => (
        <div
          key={ban.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={ban.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=90"}
            alt={ban.title}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=90"; }}
          />
        </div>
      ))}

      {/* Layered overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative min-h-[260px] px-8 py-10 sm:min-h-[300px] sm:px-14 lg:min-h-[320px] lg:px-20">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-lg"
        >
          {/* Badge */}
          <div className="mb-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-[#FF6B35] animate-pulse" />
              {b.badge}
            </span>
            {b.discount && (
              <span className="rounded-full bg-[#FF6B35] px-3 py-1 text-xs font-black text-white shadow-lg">
                {b.discount}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-poppins text-3xl font-black leading-[1.1] text-white drop-shadow-xl sm:text-4xl lg:text-5xl">
            {b.title}
          </h3>

          {/* Subtitle */}
          <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">{b.subtitle}</p>

          {/* CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={link(b.ctaLink)}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6B35] px-7 py-3 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/40 transition-all hover:scale-105 hover:bg-[#e85d2a] hover:shadow-xl"
            >
              {b.ctaLabel} <ChevronRight className="size-4" />
            </Link>
            <Link
              href={link("/order/menu")}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              View Menu
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Slide counter top-right */}
      <div className="absolute right-5 top-5 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
        {active + 1} / {banners.length}
      </div>

      {/* Prev arrow */}
      <button
        type="button"
        onClick={() => { prev(); resetTimer(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110"
        aria-label="Previous"
      >
        <ChevronRight className="size-5 rotate-180" />
      </button>

      {/* Next arrow */}
      <button
        type="button"
        onClick={() => { next(); resetTimer(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-all hover:bg-black/60 hover:scale-110"
        aria-label="Next"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Dots bottom */}
      <div className="absolute bottom-5 left-8 flex gap-2 sm:left-14 lg:left-20">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setActive(i); setAnimKey((k) => k + 1); resetTimer(); }}
            className={`h-1.5 rounded-full transition-all duration-400 ${
              i === active ? "w-8 bg-[#FF6B35]" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function CustomerHomePage() {
  const { setOrderType, setOrderTypeModalOpen } = useCustomer();
  const { menuItems, categories } = useModuleData();
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const router = useRouter();

  const featured = menuItems.filter((m) => m.badge && m.status === "active").slice(0, 6);
  const heroDish = featured[0] ?? null;

  const [searchQuery, setSearchQuery] = useState("");
  const [previewCategory, setPreviewCategory] = useState("all");

  const handleOrderType = (type) => {
    setOrderType(type);
    router.push(link("/order/menu"));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(link(`/order/menu?q=${encodeURIComponent(q)}`));
  };

  // Menu preview — categories with items, max 8 items shown
  const activeMenuItems = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);
  const previewCategories = useMemo(() => {
    const catIds = new Set(activeMenuItems.map((m) => m.categoryId));
    return categories.filter((c) => catIds.has(c.id));
  }, [categories, activeMenuItems]);
  const previewItems = useMemo(() => {
    const items = previewCategory === "all"
      ? activeMenuItems
      : activeMenuItems.filter((m) => m.categoryId === previewCategory);
    return items.slice(0, 8);
  }, [activeMenuItems, previewCategory]);

  return (
    <div className="pb-16">

      {cms.announcement?.enabled && cms.announcement?.text && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 px-4 py-2.5 text-center text-sm font-semibold"
          style={{ backgroundColor: cms.announcement.bgColor || "#FF6B35", color: cms.announcement.textColor || "#ffffff" }}
        >
          {cms.announcement.link ? (
            <a href={cms.announcement.link} className="hover:underline underline-offset-2">
              {cms.announcement.text}
              {cms.announcement.linkLabel && <span className="ml-2 underline">{cms.announcement.linkLabel}</span>}
            </a>
          ) : (
            <span>{cms.announcement.text}</span>
          )}
        </motion.div>
      )}

      {/* ══ HERO ══ */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[520px] items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">

            {/* ── Left: Text + Search ── */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#FFE4D6] bg-[#FFF8F3] px-4 py-2"
              >
                <span className="flex size-5 items-center justify-center rounded-full gradient-primary">
                  <Flame className="size-3 text-white" />
                </span>
                <span className="text-xs font-semibold text-[#FF6B35]">
                  {cms.hero.badge || "Chef Crafted · Fresh · Premium"}
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className="font-poppins text-4xl font-black leading-[1.1] tracking-tight text-[#111827] sm:text-5xl lg:text-[3.25rem]">
                {cms.hero.headline ? cms.hero.headline : (
                  <>
                    Hungry? Discover<br />
                    the best food in{" "}
                    <span className="gradient-text">{info.name || "our Kitchen"}</span>
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-md text-base leading-relaxed text-gray-500">
                {cms.hero.subheadline || "Order, eat, repeat. Fresh ingredients, bold flavors — delivered to your door or ready at your table."}
              </p>

              {/* Search bar */}
              <motion.form
                onSubmit={handleSearch}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-7 flex max-w-md items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-lg shadow-gray-100"
              >
                <Search className="size-4 shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for dishes, burgers, pizza..."
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="submit"
                  className="rounded-full gradient-primary px-5 py-2 text-xs font-bold text-white shadow-sm"
                >
                  Search
                </motion.button>
              </motion.form>

              {/* Quick pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mt-4 flex flex-wrap gap-2"
              >
                {[
                  { label: "Burgers", q: "burger" },
                  { label: "Pizza",   q: "pizza" },
                  { label: "Pasta",   q: "pasta" },
                  { label: "Salads",  q: "salad" },
                  { label: "Drinks",  q: "drink" },
                ].map(({ label, q }) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => router.push(link(`/order/menu?q=${q}`))}
                    className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-[#FF6B35]/40 hover:text-[#FF6B35]"
                  >
                    {label}
                  </button>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-8 flex flex-wrap gap-6"
              >
                {(cms.about?.stats?.length > 0
                  ? cms.about.stats.slice(0, 3).map((s) => ({ value: s.value, label: s.label }))
                  : [
                      { value: "50+",    label: "Menu Items" },
                      { value: "4.9 ★",  label: "Avg Rating" },
                      { value: "20 min", label: "Avg Prep Time" },
                    ]
                ).map(({ value, label }) => (
                  <div key={label} className="flex flex-col">
                    <span className="font-poppins text-2xl font-black text-[#FF6B35]">{value}</span>
                    <span className="text-xs text-gray-500">{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 16px 32px rgba(255,107,53,0.3)" }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setOrderTypeModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/25"
                >
                  {cms.hero.ctaPrimaryLabel || "Order Now"} <ChevronRight className="size-4" />
                </motion.button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={link("/order/table-booking")}
                    className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-7 py-3.5 text-sm font-bold text-[#111827] transition-all hover:border-[#FF6B35]/40 hover:shadow-md"
                  >
                    <CalendarClock className="size-4 text-[#FF6B35]" />
                    {cms.hero.ctaSecondaryLabel || "Book a Table"}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* ── Right: Food image collage ── */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              {/* Main large image */}
              <div className="relative overflow-hidden rounded-3xl shadow-2xl shadow-[#FF6B35]/10">
                <img
                  src={heroDish?.image || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"}
                  alt={heroDish?.name || "Delicious food"}
                  className="h-[380px] w-full object-cover"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80"; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Overlay info */}
                {heroDish && (
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-poppins text-lg font-bold text-white">{heroDish.name}</p>
                        <p className="text-sm text-white/70">{heroDish.categoryName}</p>
                      </div>
                      <span className="rounded-2xl bg-white/95 px-3 py-1.5 text-sm font-bold text-[#FF6B35] shadow-sm backdrop-blur-sm">
                        {formatCustomerMoney(heroDish.price ?? 0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Chef's Special badge */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-4 top-4 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                >
                  <span className="flex size-6 items-center justify-center rounded-full gradient-primary">
                    <Award className="size-3.5 text-white" />
                  </span>
                  <span className="text-xs font-bold text-[#111827]">Chef&apos;s Special</span>
                </motion.div>
              </div>

              {/* Small image grid — bottom */}
              <div className="mt-3 grid grid-cols-3 gap-3">
                {[
                  { src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80", label: "Pizza" },
                  { src: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80", label: "Salad" },
                  { src: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80", label: "Dessert" },
                ].map(({ src, label }) => (
                  <div key={label} className="group relative overflow-hidden rounded-2xl shadow-md">
                    <img
                      src={src}
                      alt={label}
                      className="h-24 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/20 transition-all group-hover:bg-black/10" />
                    <span className="absolute bottom-2 left-2 text-xs font-bold text-white drop-shadow">{label}</span>
                  </div>
                ))}
              </div>

              {/* Floating order count */}
              <motion.div
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                className="absolute -right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl border border-[#FFE4D6]"
              >
                <div className="flex -space-x-1.5">
                  {["A", "R", "P"].map((initial, i) => (
                    <span key={i} className="flex size-7 items-center justify-center rounded-full border-2 border-white gradient-primary text-[10px] font-bold text-white">{initial}</span>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111827]">200+ orders today</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="size-3 text-[#22C55E]" />
                    <span className="text-[10px] font-semibold text-[#22C55E]">+12% this week</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ PROMO BANNER SLIDER ══ */}
      {cms.banners?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <PromoBannerSlider banners={cms.banners} link={link} />
        </section>
      )}

      {/* ══ ORDER TYPES ══ */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-10 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">How You Dine</span>
              <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">Choose Your Order Style</h2>
              <p className="mt-3 text-sm text-gray-500">Pick one — you can change it anytime before checkout.</p>
            </motion.div>
            <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-3">
              {CUSTOMER_ORDER_TYPES.map((type) => {
                const ui = ORDER_TYPE_UI[type.id];
                const Icon = ui?.Icon ?? Store;
                return (
                  <motion.button key={type.id} variants={fadeUp}
                    whileHover={{ y: -8, boxShadow: "0 24px 48px rgba(255,107,53,0.12)" }}
                    whileTap={{ scale: 0.98 }} type="button" onClick={() => handleOrderType(type.id)}
                    className="group flex flex-col items-start rounded-3xl border border-gray-100 bg-white p-7 text-left shadow-sm transition-all duration-300 hover:border-[#FF6B35]/20">
                    <div className={`mb-5 flex size-16 items-center justify-center rounded-2xl ${ui?.iconBg} shadow-lg shadow-[#FF6B35]/20`}>
                      <Icon className="size-8 text-white" />
                    </div>
                    <h3 className="font-poppins text-xl font-bold text-[#111827]">{type.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{type.description}</p>
                    <div className={`mt-5 flex items-center gap-1.5 text-sm font-bold ${ui?.accent}`}>
                      Start ordering <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-10 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Browse</span>
              <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">Explore Your Dish</h2>
              <p className="mt-3 text-sm text-gray-500">Browse by category and find exactly what you&apos;re craving.</p>
            </motion.div>
            <motion.div variants={stagger} className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-7">
              {CUSTOMER_HOME_CATEGORIES.map((cat) => (
                <motion.div key={cat.label} variants={fadeUp}>
                  <Link href={link("/order/menu")}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B35]/30 hover:shadow-md">
                    <div className="size-16 overflow-hidden rounded-full border-2 border-gray-100 transition-all group-hover:border-[#FF6B35]/30">
                      <img
                        src={cat.image}
                        alt={cat.label}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80"; }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{cat.label}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══ FEATURED DISHES ══ */}
      {featured.length > 0 && (
        <section className="bg-gray-50 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection>
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <motion.div variants={fadeUp}>
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Chef&apos;s Pick</span>
                  <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">Chef&apos;s Favorite</h2>
                  <p className="mt-2 text-sm text-gray-500">Handpicked by our chef — fresh, bold, and unforgettable.</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Link href={link("/order/menu")} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#FF6B35] shadow-sm transition-all hover:shadow-md">
                    View All <ArrowRight className="size-4" />
                  </Link>
                </motion.div>
              </div>
              <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((item) => (
                  <motion.article key={item.id} variants={fadeUp} whileHover={{ y: -6 }}
                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-[#FF6B35]/8">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <SafeDishImage src={item.image} alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        iconClassName="size-14 text-[#FF6B35]/30" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      {item.badge && (
                        <span className="absolute left-3 top-3 rounded-full gradient-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">{item.badge}</span>
                      )}
                      <span className="absolute bottom-3 right-3 rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[#FF6B35] shadow-md">
                        {formatCustomerMoney(item.price ?? 0)}
                      </span>
                    </div>
                    <div className="flex flex-col p-5">
                      <h3 className="font-poppins text-base font-bold text-[#111827] flex items-center gap-2">
                        <FoodTypeIndicator type={item.itemType} size={14} />
                        {item.name}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-500">{item.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                          {(item.prepTime ?? 99) < 10 ? <Zap className="size-3.5 text-amber-400" /> : <Clock className="size-3.5 text-gray-400" />}
                          {item.prepTime != null ? `${item.prepTime} min` : "—"}
                        </span>
                        <Link href={link("/order/menu")} className="rounded-full gradient-primary px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:shadow-[#FF6B35]/30">
                          Add to Order
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ══ MENU PREVIEW ══ */}
      {previewItems.length > 0 && (
        <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <AnimatedSection>
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <motion.div variants={fadeUp}>
                  <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Explore</span>
                  <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">Our Delicious Menu</h2>
                  <p className="mt-2 text-sm text-gray-500">Fresh ingredients, authentic flavors — crafted with love.</p>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Link href={link("/order/menu")} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#FF6B35] shadow-sm transition-all hover:shadow-md">
                    View Full Menu <ArrowRight className="size-4" />
                  </Link>
                </motion.div>
              </div>
              <motion.div variants={fadeUp} className="-mx-1 mb-7 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
                {[{ id: "all", name: "All" }, ...previewCategories].map((c) => (
                  <button key={c.id} type="button" onClick={() => setPreviewCategory(c.id)}
                    className={`shrink-0 rounded-full px-5 py-2 text-xs font-semibold transition-all ${previewCategory === c.id ? "gradient-primary text-white shadow-md shadow-[#FF6B35]/20" : "border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"}`}>
                    {c.name}
                  </button>
                ))}
              </motion.div>
              <motion.div key={previewCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {previewItems.map((item) => (
                  <motion.div key={item.id} whileHover={{ y: -5 }}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#FF6B35]/8">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <SafeDishImage src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" iconClassName="size-12 text-[#FF6B35]/25" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      {item.badge && <span className="absolute left-2.5 top-2.5 rounded-full gradient-primary px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">{item.badge}</span>}
                      <span className="absolute bottom-2.5 right-2.5 rounded-full bg-white px-2.5 py-1 text-sm font-bold text-[#FF6B35] shadow-md">{formatCustomerMoney(item.price ?? 0)}</span>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="flex items-center gap-1.5 font-poppins text-sm font-bold text-[#111827] line-clamp-1">
                        <FoodTypeIndicator type={item.itemType} size={13} />{item.name}
                      </h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-400">{item.description}</p>}
                      <Link href={link("/order/menu")} className="mt-auto pt-3 flex items-center justify-center gap-1.5 rounded-full gradient-primary py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:shadow-[#FF6B35]/30">
                        <Plus className="size-3.5" /> Add to Order
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 text-center">
                <Link href={link("/order/menu")} className="inline-flex items-center gap-2 rounded-full border-2 border-gray-200 bg-white px-8 py-3.5 text-sm font-bold text-[#111827] shadow-sm transition-all hover:border-[#FF6B35]/40 hover:shadow-md">
                  View All Items <ArrowRight className="size-4 text-[#FF6B35]" />
                </Link>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-10 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Simple Process</span>
              <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">How It Works</h2>
              <p className="mt-3 text-sm text-gray-500">From browsing to enjoying — quick and clear.</p>
            </motion.div>
            <motion.div variants={stagger} className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible">
              {CUSTOMER_HOME_STEPS.map(({ n, title, text, icon }) => {
                const Icon = STEP_ICON_MAP[icon] ?? LayoutGrid;
                return (
                  <motion.div key={n} variants={fadeUp} whileHover={{ y: -5 }}
                    className="min-w-[min(100%,220px)] shrink-0 snap-center rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg lg:min-w-0">
                    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl gradient-primary shadow-md shadow-[#FF6B35]/20">
                      <Icon className="size-5 text-white" />
                    </div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">{n}</p>
                    <h3 className="font-poppins text-sm font-bold text-[#111827]">{title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{text}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══ REVIEWS ══ */}
      <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="mb-10 text-center">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FF6B35]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">Reviews</span>
              <h2 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">Voices of Our Food Lovers</h2>
              <p className="mt-3 text-sm text-gray-500">See why our guests keep coming back for more.</p>
            </motion.div>
            <motion.div variants={stagger} className="grid gap-5 md:grid-cols-3">
              {CUSTOMER_HOME_REVIEWS.map((r) => (
                <motion.blockquote key={r.name} variants={fadeUp} whileHover={{ y: -5 }}
                  className="flex flex-col rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-gray-600">&ldquo;{r.quote}&rdquo;</p>
                  <footer className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-5">
                    <div className="flex size-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white shadow-sm">
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-poppins text-sm font-bold text-[#111827]">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.role}</p>
                    </div>
                  </footer>
                </motion.blockquote>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="bg-gray-50 px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <AnimatedSection>
            <motion.div variants={fadeUp}
              className="relative overflow-hidden rounded-3xl gradient-primary px-8 py-12 text-center shadow-2xl shadow-[#FF6B35]/20 sm:px-14 md:flex md:items-center md:justify-between md:text-left">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-white/10 blur-3xl" />
              </div>
              <div className="relative">
                <h3 className="font-poppins text-3xl font-black text-white sm:text-4xl">Ready to Order?</h3>
                <p className="mt-2 text-sm text-white/80">Fresh food, seamless checkout, and real-time updates you can trust.</p>
              </div>
              <div className="relative mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-0 md:shrink-0">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                  type="button" onClick={() => setOrderTypeModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-[#FF6B35] shadow-lg transition-all hover:shadow-xl">
                  Order Now <ChevronRight className="size-4" />
                </motion.button>
                <Link href={link("/order/table-booking")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/15 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25">
                  <CalendarClock className="size-4" /> Book Table
                </Link>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

    </div>
  );
}
