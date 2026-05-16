"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import SafeDishImage from "@/components/customer/SafeDishImage";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { CUSTOMER_HOME_CATEGORIES, CUSTOMER_HOME_REVIEWS, CUSTOMER_HOME_STEPS, CUSTOMER_ORDER_TYPES } from "@/config/customerContent";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight, BarChart3, Bike, CalendarClock, ChefHat,
  ChevronRight, Clock, ConciergeBell, CreditCard, LayoutGrid,
  PackageSearch, Star, Store, Zap, Flame, Award, TrendingUp
} from "lucide-react";
import Link from "next/link";
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

export default function CustomerHomePage() {
  const { setOrderType, setOrderTypeModalOpen } = useCustomer();
  const { menuItems } = useModuleData();
  const { link } = useRestaurantSlug();
  const router = useRouter();

  const featured = menuItems.filter((m) => m.badge && m.status === "active").slice(0, 6);
  const heroDish = featured[0] ?? null;

  const handleOrderType = (type) => {
    setOrderType(type);
    router.push(link("/order/menu"));
  };

  return (
    <div className="pb-16">

      {/* ══ HERO ══ */}
      <section className="relative overflow-hidden px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-16">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#FFE4D6] bg-white px-4 py-2 shadow-sm"
              >
                <span className="flex size-5 items-center justify-center rounded-full gradient-primary">
                  <Flame className="size-3 text-white" />
                </span>
                <span className="text-xs font-semibold text-[#FF6B35]">Chef Crafted · Fresh · Premium</span>
              </motion.div>

              {/* Heading */}
              <h1 className="font-poppins text-4xl font-black leading-[1.1] tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
                Delicious Food,{" "}
                <span className="gradient-text">Delivered</span>{" "}
                <br className="hidden sm:block" />
                to Your Door
              </h1>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-[#6B7280] sm:text-lg">
                Explore our kitchen specials, book a table, or order for takeaway and delivery — all in one seamless experience.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(255,107,53,0.35)" }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setOrderTypeModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl gradient-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF6B35]/30 transition-all"
                >
                  Order Now <ChevronRight className="size-4" />
                </motion.button>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={link("/order/table-booking")}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[#FFE4D6] bg-white px-7 py-3.5 text-sm font-bold text-[#111827] shadow-sm transition-all hover:border-[#FF6B35]/40 hover:shadow-md"
                  >
                    <CalendarClock className="size-4 text-[#FF6B35]" />
                    Book a Table
                  </Link>
                </motion.div>
              </div>

              {/* Stats */}
              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { value: "50+", label: "Dishes", icon: ChefHat },
                  { value: "4.9★", label: "Rating", icon: Star },
                  { value: "20 min", label: "Avg. Prep", icon: Clock },
                ].map(({ value, label, icon: Icon }) => (
                  <motion.div
                    key={label}
                    whileHover={{ y: -2 }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-[#FF6B35]/10">
                      <Icon className="size-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <p className="font-poppins text-lg font-bold text-[#111827]">{value}</p>
                      <p className="text-xs text-[#6B7280]">{label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — Hero dish card */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFF8F3] to-[#FFE4D6] p-1 shadow-2xl shadow-[#FF6B35]/15">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                  {heroDish ? (
                    <>
                      <SafeDishImage
                        src={heroDish.image}
                        alt={heroDish.name}
                        className="h-full w-full object-cover"
                        iconClassName="size-20 text-[#FF6B35]/30"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Floating badges */}
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-4 top-4 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                      >
                        <span className="flex size-6 items-center justify-center rounded-full gradient-primary">
                          <Award className="size-3.5 text-white" />
                        </span>
                        <span className="text-xs font-bold text-[#111827]">Chef&apos;s Special</span>
                      </motion.div>
                      <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute right-4 top-4 rounded-2xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                      >
                        <p className="text-xs text-[#6B7280]">Starting from</p>
                        <p className="font-poppins text-base font-bold text-[#FF6B35]">{formatCustomerMoney(heroDish.price ?? 0)}</p>
                      </motion.div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="font-poppins text-xl font-bold text-white">{heroDish.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-white/80">{heroDish.description}</p>
                        <Link href={link("/order/menu")}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30">
                          View on Menu <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                      <div className="flex size-20 items-center justify-center rounded-2xl gradient-primary shadow-lg">
                        <ChefHat className="size-10 text-white" />
                      </div>
                      <div>
                        <p className="font-poppins text-xl font-bold text-[#111827]">Menu Coming Soon</p>
                        <p className="mt-1 text-sm text-[#6B7280]">Chef is preparing something special</p>
                      </div>
                      <Link href={link("/order/menu")}
                        className="rounded-xl gradient-primary px-6 py-2.5 text-sm font-bold text-white shadow-md">
                        Browse Menu
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating order count badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl"
              >
                <div className="flex -space-x-2">
                  {["🧑", "👩", "👨"].map((e, i) => (
                    <span key={i} className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#FFF8F3] text-sm">{e}</span>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#111827]">200+ orders today</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="size-3 text-[#22C55E]" />
                    <span className="text-[10px] text-[#22C55E] font-semibold">+12% this week</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ ORDER TYPES ══ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader badge="How You Dine" title="Choose Your Order Style" subtitle="Pick one — you can change it anytime before checkout." />
          <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {CUSTOMER_ORDER_TYPES.map((type) => {
              const ui = ORDER_TYPE_UI[type.id];
              const Icon = ui?.Icon ?? Store;
              return (
                <motion.button
                  key={type.id}
                  variants={fadeUp}
                  whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(255,107,53,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => handleOrderType(type.id)}
                  className={`group flex flex-col rounded-2xl border-2 bg-gradient-to-br p-6 text-left transition-all duration-300 ${ui?.bg} ${ui?.border}`}
                >
                  <div className={`mb-4 flex size-14 items-center justify-center rounded-2xl ${ui?.iconBg} shadow-lg`}>
                    <Icon className="size-7 text-white" />
                  </div>
                  <h3 className="font-poppins text-lg font-bold text-[#111827]">{type.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#6B7280]">{type.description}</p>
                  <div className={`mt-4 flex items-center gap-1 text-xs font-bold ${ui?.accent}`}>
                    Start ordering <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader badge="Browse" title="Popular Categories" />
          <motion.div variants={stagger} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {CUSTOMER_HOME_CATEGORIES.map((cat) => (
              <motion.div key={cat.label} variants={fadeUp}>
                <Link
                  href={link("/order/menu")}
                  className="group flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-[#FFE4D6] bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#FF6B35]/40 hover:shadow-lg sm:min-h-[140px] sm:p-6"
                >
                  <motion.span
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="text-3xl sm:text-4xl"
                  >
                    {cat.emoji}
                  </motion.span>
                  <span className="text-xs font-semibold text-[#111827] sm:text-sm">{cat.label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══ FEATURED DISHES ══ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <motion.div variants={fadeUp}>
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#FFE4D6] bg-[#FF6B35]/8 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF6B35]">
                  Chef&apos;s Pick
                </span>
                <h2 className="font-poppins text-2xl font-bold text-[#111827] sm:text-3xl">Featured Dishes</h2>
              </motion.div>
              <motion.div variants={fadeUp}>
                <Link href={link("/order/menu")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFE4D6] bg-white px-4 py-2 text-sm font-semibold text-[#FF6B35] shadow-sm transition-all hover:shadow-md">
                  View Full Menu <ArrowRight className="size-4" />
                </Link>
              </motion.div>
            </div>

            <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((item) => (
                <motion.article
                  key={item.id}
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  className="group overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-[#FF6B35]/10"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#FFF8F3]">
                    <SafeDishImage
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      iconClassName="size-14 text-[#FF6B35]/30"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    {item.badge && (
                      <span className="absolute left-3 top-3 rounded-full gradient-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-xl bg-white/95 px-3 py-1.5 text-sm font-bold text-[#FF6B35] shadow-sm backdrop-blur-sm">
                      {formatCustomerMoney(item.price ?? 0)}
                    </span>
                  </div>
                  <div className="flex flex-col p-4 sm:p-5">
                    <h3 className="font-poppins font-semibold text-[#111827]">{item.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#6B7280] sm:text-sm">{item.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#FFE4D6] pt-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#6B7280]">
                        {(item.prepTime ?? 99) < 10
                          ? <Zap className="size-3.5 text-[#F59E0B]" />
                          : <Clock className="size-3.5 text-[#6B7280]" />}
                        {item.prepTime != null ? `${item.prepTime} min` : "—"}
                      </span>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link href={link("/order/menu")}
                          className="rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:shadow-md hover:shadow-[#FF6B35]/30">
                          Add to Order
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </AnimatedSection>
        </section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader badge="Simple Process" title="How It Works" subtitle="From browsing to enjoying — quick and clear." />
          <motion.div variants={stagger} className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible">
            {CUSTOMER_HOME_STEPS.map(({ n, title, text, icon }, i) => {
              const Icon = STEP_ICON_MAP[icon] ?? LayoutGrid;
              return (
                <motion.div
                  key={n}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="min-w-[min(100%,240px)] shrink-0 snap-center rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm transition-all hover:border-[#FF6B35]/30 hover:shadow-lg lg:min-w-0"
                >
                  <div className="mb-3 flex size-12 items-center justify-center rounded-2xl gradient-primary shadow-md shadow-[#FF6B35]/20">
                    <Icon className="size-5 text-white" />
                  </div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#FF6B35]">{n}</p>
                  <h3 className="font-poppins text-sm font-semibold text-[#111827]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#6B7280]">{text}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══ REVIEWS ══ */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <AnimatedSection>
          <SectionHeader badge="Reviews" title="What Customers Say" />
          <motion.div variants={stagger} className="grid gap-4 md:grid-cols-3 md:gap-5">
            {CUSTOMER_HOME_REVIEWS.map((r) => (
              <motion.blockquote
                key={r.name}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-[#FFE4D6] bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:shadow-[#FF6B35]/8 sm:p-6"
              >
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-[#F59E0B] text-[#F59E0B]" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#374151]">&ldquo;{r.quote}&rdquo;</p>
                <footer className="mt-4 border-t border-[#FFE4D6] pt-4">
                  <p className="font-poppins text-sm font-semibold text-[#111827]">{r.name}</p>
                  <p className="text-xs text-[#6B7280]">{r.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </motion.div>
        </AnimatedSection>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <AnimatedSection>
          <motion.div
            variants={fadeUp}
            className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-center shadow-2xl shadow-[#FF6B35]/25 sm:p-12 md:flex md:items-center md:justify-between md:text-left"
          >
            {/* Background pattern */}
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/30 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-white/20 blur-3xl" />
            </div>

            <div className="relative max-w-lg md:mx-0">
              <h3 className="font-poppins text-2xl font-black text-white sm:text-3xl">
                Ready to Order? 🍽️
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Fresh food, seamless checkout, and real-time updates you can trust.
              </p>
            </div>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-0 md:shrink-0">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setOrderTypeModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-[#FF6B35] shadow-lg transition-all"
              >
                Order Now <ChevronRight className="size-4" />
              </motion.button>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={link("/order/table-booking")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 bg-white/15 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
                >
                  <CalendarClock className="size-4" /> Book Table
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

    </div>
  );
}
