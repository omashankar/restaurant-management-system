"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import {
  CUSTOMER_HOME_CATEGORIES,
  CUSTOMER_HOME_REVIEWS,
  CUSTOMER_HOME_STEPS,
  CUSTOMER_ORDER_TYPES,
} from "@/config/customerContent";
import {
  ArrowRight,
  BarChart3,
  Bike,
  CalendarClock,
  ChefHat,
  ChevronRight,
  Clock,
  ConciergeBell,
  CreditCard,
  LayoutGrid,
  PackageSearch,
  Star,
  Store,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const STEP_ICON_MAP = {
  "layout-grid": LayoutGrid,
  "credit-card": CreditCard,
  "package-search": PackageSearch,
  "chef-hat": ChefHat,
  "bar-chart-3": BarChart3,
};

const ORDER_TYPE_UI = {
  "dine-in": {
    Icon: Store,
    container: "border-emerald-500/20 bg-gradient-to-br from-emerald-50 to-emerald-100/40 hover:shadow-emerald-100",
    iconWrap: "bg-white text-emerald-700 ring-1 ring-emerald-200",
    textAccent: "text-emerald-700",
  },
  takeaway: {
    Icon: ConciergeBell,
    container: "border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-indigo-100/40 hover:shadow-indigo-100",
    iconWrap: "bg-white text-indigo-700 ring-1 ring-indigo-200",
    textAccent: "text-indigo-700",
  },
  delivery: {
    Icon: Bike,
    container: "border-sky-500/20 bg-gradient-to-br from-sky-50 to-sky-100/40 hover:shadow-sky-100",
    iconWrap: "bg-white text-sky-700 ring-1 ring-sky-200",
    textAccent: "text-sky-700",
  },
};

export default function CustomerHomePage() {
  const { setOrderType, setOrderTypeModalOpen } = useCustomer();
  const { menuItems } = useModuleData();
  const router = useRouter();

  const featured = menuItems.filter((m) => m.badge && m.status === "active").slice(0, 3);
  const heroDish = featured[0] ?? null;

  const handleOrderType = (type) => {
    setOrderType(type);
    router.push("/order/menu");
  };

  return (
    <div className="pb-4">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden px-4 pb-14 pt-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-200/50 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl rounded-3xl border border-zinc-200 bg-white px-6 py-10 shadow-sm sm:px-10 sm:py-12">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700">
                <Star className="size-3.5" /> Chef Crafted · Fresh Ingredients · Warm Service
              </span>
              <h1 className="mt-5 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                Delicious Meals,
                <span className="block text-emerald-700">Ready When You Are</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
                Welcome to RMS Restaurant. Explore our kitchen specials, reserve your table, or order freshly prepared meals for takeaway and delivery.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderTypeModalOpen(true)}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-sm transition-all hover:bg-emerald-400 active:scale-95"
                >
                  Start Ordering <ChevronRight className="size-4" />
                </button>
                <Link
                  href="/order/table-booking"
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 py-3.5 text-sm font-semibold text-zinc-800 transition-all hover:border-zinc-400 hover:bg-zinc-50"
                >
                  <CalendarClock className="size-4" /> Book a Table
                </Link>
              </div>
              <p className="mt-4 text-xs text-zinc-500">Open Daily: 11:00 AM - 11:00 PM | 123 Restaurant Street, Food City</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Today&apos;s Highlight</p>
              {heroDish ? (
                <div className="mt-3">
                  <p className="text-lg font-bold text-zinc-900">{heroDish.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{heroDish.description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-emerald-700">${heroDish.price?.toFixed(2)}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {heroDish.prepTime ?? 20} min
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-600">Chef specials are being updated. Explore our menu for fresh picks.</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { value: "50+",    label: "Signature Dishes" },
              { value: "4.9★",   label: "Guest Rating" },
              { value: "20 min", label: "Avg. Kitchen Prep" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-center">
                <p className="text-xl font-bold text-emerald-700">{s.value}</p>
                <p className="mt-1 text-xs text-zinc-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ORDER TYPE CARDS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">RMS Restaurant Service</p>
          <h2 className="text-2xl font-bold text-zinc-900">How do you want to order?</h2>
          <p className="mt-2 text-sm text-zinc-600">Choose your preferred way to enjoy our food</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">

          {CUSTOMER_ORDER_TYPES.map((type) => {
            const ui = ORDER_TYPE_UI[type.id];
            const Icon = ui.Icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleOrderType(type.id)}
                className={`cursor-pointer group rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${ui.container}`}
              >
                <span className={`flex size-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${ui.iconWrap}`}>
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-4 text-base font-bold text-zinc-900">{type.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{type.description}</p>
                <span className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${ui.textAccent}`}>
                  Start ordering <ChevronRight className="size-3.5" />
                </span>
              </button>
            );
          })}

        </div>
      </section>

      {/* ══════════════════════════════════════
          POPULAR CATEGORIES
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Browse by Category</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900">Popular Categories</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CUSTOMER_HOME_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/order/menu"
              className={`cursor-pointer group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${cat.color}`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-sm font-semibold">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED DISHES
      ══════════════════════════════════════ */}
      {featured.length > 0 && (
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Chef&apos;s Pick</p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-900">Featured Dishes</h2>
            </div>
            <Link href="/order/menu" className="cursor-pointer inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
              View full menu <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="relative aspect-video overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent" />
                  {item.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase text-zinc-950">
                      {item.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-1 text-sm font-bold text-emerald-700 backdrop-blur-sm">
                    ${item.price?.toFixed(2)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-600">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      {(item.prepTime ?? 99) < 10
                        ? <Zap className="size-3.5 text-amber-400" />
                        : <Clock className="size-3.5" />}
                      {item.prepTime} min
                    </span>
                    <Link href="/order/menu" className="cursor-pointer rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500 hover:text-zinc-950">
                      Order →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Simple Process</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900">How It Works</h2>
          <p className="mt-2 text-sm text-zinc-600">From browsing to enjoying — it&apos;s that easy</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CUSTOMER_HOME_STEPS.map(({ n, title, text, icon }) => {
            const Icon = STEP_ICON_MAP[icon] ?? LayoutGrid;
            return (
              <div
                key={n}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-md"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <Icon className="size-4" />
                </span>
                <p className="mt-3 text-xs font-semibold tracking-widest text-emerald-500">{n}</p>
                <h3 className="mt-1 text-sm font-semibold text-zinc-900">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">{text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Reviews</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-900">What Our Customers Say</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {CUSTOMER_HOME_REVIEWS.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700">&ldquo;{r.quote}&rdquo;</p>
              <div className="mt-4 border-t border-zinc-200 pt-4">
                <p className="text-sm font-semibold text-zinc-900">{r.name}</p>
                <p className="text-xs text-zinc-600">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-8 text-center shadow-lg md:flex md:items-center md:justify-between md:text-left">
          <div>
            <h3 className="text-xl font-bold text-white">Ready to order?</h3>
            <p className="mt-1 text-sm text-emerald-100">Fresh food, fast delivery, great taste.</p>
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3 md:mt-0">
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="cursor-pointer rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              Order Now
            </button>
            <Link
              href="/order/table-booking"
              className="cursor-pointer rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              Book Table
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
