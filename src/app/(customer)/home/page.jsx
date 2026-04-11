"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
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

/* ── Customer-adapted How It Works steps ── */
const STEPS = [
  { n: "01", title: "Choose Order Type",   text: "Select Dine-In, Takeaway, or Delivery based on your preference.",  Icon: LayoutGrid },
  { n: "02", title: "Browse the Menu",     text: "Explore categories, filter by veg/non-veg, and pick your favourites.", Icon: CreditCard },
  { n: "03", title: "Add to Cart",         text: "Adjust quantities and review your selections before checkout.",       Icon: PackageSearch },
  { n: "04", title: "Place Your Order",    text: "Confirm details and submit — kitchen gets notified instantly.",       Icon: ChefHat },
  { n: "05", title: "Enjoy Your Meal",     text: "Track status and enjoy fresh food prepared just for you.",            Icon: BarChart3 },
];

/* ── Customer testimonials ── */
const REVIEWS = [
  { name: "Aisha Khan",    role: "Regular Customer",  quote: "Food is always fresh and delivery is super fast. Love the online ordering!" },
  { name: "Rohan Sharma",  role: "Dine-In Guest",     quote: "Table booking was seamless and the staff was very welcoming." },
  { name: "Priya Nair",    role: "Takeaway Customer", quote: "Order was ready exactly on time. The app makes it so easy to order ahead." },
];

/* ── Popular categories ── */
const CATEGORIES = [
  { label: "Starters",   emoji: "🥗", color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" },
  { label: "Main Course",emoji: "🍛", color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-400" },
  { label: "Beverages",  emoji: "🥤", color: "border-sky-500/20 bg-sky-500/5 text-sky-400" },
  { label: "Desserts",   emoji: "🍰", color: "border-amber-500/20 bg-amber-500/5 text-amber-400" },
];

export default function CustomerHomePage() {
  const { setOrderType, setOrderTypeModalOpen } = useCustomer();
  const { menuItems } = useModuleData();
  const router = useRouter();

  const featured = menuItems.filter((m) => m.badge && m.status === "active").slice(0, 3);

  const handleOrderType = (type) => {
    setOrderType(type);
    router.push("/order/menu");
  };

  return (
    <div>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -right-20 bottom-10 h-96 w-96 rounded-full bg-sky-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-400">
            <Star className="size-3.5" /> Fresh · Fast · Delicious
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl lg:text-6xl">
            Great Food,{" "}
            <span className="text-emerald-400">Delivered Fast</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400">
            Order your favourite dishes online — dine in, take away, or get it delivered to your door.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 active:scale-95"
            >
              Order Now <ChevronRight className="size-4" />
            </button>
            <Link
              href="/order/table-booking"
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-6 py-4 text-sm font-semibold text-zinc-200 transition-all hover:border-zinc-500 hover:bg-zinc-800"
            >
              <CalendarClock className="size-4" /> Book a Table
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { value: "50+",    label: "Menu Items" },
              { value: "4.9★",   label: "Rating" },
              { value: "20 min", label: "Avg. Delivery" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-4">
                <p className="text-xl font-bold text-emerald-400">{s.value}</p>
                <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          ORDER TYPE CARDS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-zinc-100">How do you want to order?</h2>
          <p className="mt-2 text-sm text-zinc-500">Choose your preferred way to enjoy our food</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">

          <button
            type="button"
            onClick={() => handleOrderType("dine-in")}
            className="cursor-pointer group rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-zinc-900/60 text-emerald-400 ring-1 ring-zinc-700 transition-transform duration-200 group-hover:scale-110">
              <Store className="size-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-zinc-100">Dine-In</h3>
            <p className="mt-2 text-sm text-zinc-500">Reserve a table and enjoy your meal with us.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
              Start ordering <ChevronRight className="size-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOrderType("takeaway")}
            className="cursor-pointer group rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-zinc-900/60 text-indigo-400 ring-1 ring-zinc-700 transition-transform duration-200 group-hover:scale-110">
              <ConciergeBell className="size-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-zinc-100">Takeaway</h3>
            <p className="mt-2 text-sm text-zinc-500">Order ahead and pick up when ready.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-indigo-400">
              Start ordering <ChevronRight className="size-3.5" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOrderType("delivery")}
            className="cursor-pointer group rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-500/5 p-6 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30"
          >
            <span className="flex size-12 items-center justify-center rounded-xl bg-zinc-900/60 text-sky-400 ring-1 ring-zinc-700 transition-transform duration-200 group-hover:scale-110">
              <Bike className="size-6" />
            </span>
            <h3 className="mt-4 text-base font-bold text-zinc-100">Delivery</h3>
            <p className="mt-2 text-sm text-zinc-500">Get your order delivered to your door.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-sky-400">
              Start ordering <ChevronRight className="size-3.5" />
            </span>
          </button>

        </div>
      </section>

      {/* ══════════════════════════════════════
          POPULAR CATEGORIES
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Browse by Category</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-100">Popular Categories</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/order/menu"
              className={`cursor-pointer group flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30 ${cat.color}`}
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
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Chef&apos;s Pick</p>
              <h2 className="mt-1 text-2xl font-bold text-zinc-100">Featured Dishes</h2>
            </div>
            <Link href="/order/menu" className="cursor-pointer inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:text-emerald-300">
              View full menu <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <div key={item.id} className="group overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30">
                <div className="relative aspect-video overflow-hidden bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-950/70 to-transparent" />
                  {item.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold uppercase text-zinc-950">
                      {item.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-lg bg-zinc-950/80 px-3 py-1 text-sm font-bold text-emerald-400 backdrop-blur-sm">
                    ${item.price?.toFixed(2)}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-zinc-100">{item.name}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      {(item.prepTime ?? 99) < 10
                        ? <Zap className="size-3.5 text-amber-400" />
                        : <Clock className="size-3.5" />}
                      {item.prepTime} min
                    </span>
                    <Link href="/order/menu" className="cursor-pointer rounded-lg bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-zinc-950">
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
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Simple Process</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-100">How It Works</h2>
          <p className="mt-2 text-sm text-zinc-500">From browsing to enjoying — it&apos;s that easy</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ n, title, text, Icon }) => (
            <div
              key={n}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-black/30"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Icon className="size-4" />
              </span>
              <p className="mt-3 text-xs font-semibold tracking-widest text-emerald-500">{n}</p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Reviews</p>
          <h2 className="mt-2 text-2xl font-bold text-zinc-100">What Our Customers Say</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <div
              key={r.name}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-black/30"
            >
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">&ldquo;{r.quote}&rdquo;</p>
              <div className="mt-4 border-t border-zinc-800 pt-4">
                <p className="text-sm font-semibold text-zinc-100">{r.name}</p>
                <p className="text-xs text-zinc-500">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-8 text-center shadow-xl shadow-emerald-500/20 md:flex md:items-center md:justify-between md:text-left">
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
