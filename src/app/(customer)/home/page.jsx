"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import SafeDishImage from "@/components/customer/SafeDishImage";
import { formatCustomerMoney } from "@/lib/customerCurrency";
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
    container:
      "border-emerald-500/25 bg-gradient-to-br from-emerald-50 to-emerald-100/50 shadow-sm hover:shadow-emerald-100/80 hover:border-emerald-500/40",
    iconWrap: "bg-white text-emerald-700 ring-1 ring-emerald-200/80 shadow-sm",
    textAccent: "text-emerald-700",
  },
  takeaway: {
    Icon: ConciergeBell,
    container:
      "border-indigo-500/25 bg-gradient-to-br from-indigo-50 to-indigo-100/50 shadow-sm hover:shadow-indigo-100/80 hover:border-indigo-500/40",
    iconWrap: "bg-white text-indigo-700 ring-1 ring-indigo-200/80 shadow-sm",
    textAccent: "text-indigo-700",
  },
  delivery: {
    Icon: Bike,
    container:
      "border-sky-500/25 bg-gradient-to-br from-sky-50 to-sky-100/50 shadow-sm hover:shadow-sky-100/80 hover:border-sky-500/40",
    iconWrap: "bg-white text-sky-700 ring-1 ring-sky-200/80 shadow-sm",
    textAccent: "text-sky-700",
  },
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

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
    <div className="pb-8 sm:pb-10">

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-12 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-0 h-72 w-72 rounded-full bg-emerald-200/45 blur-3xl sm:h-96 sm:w-96" />
          <div className="absolute bottom-[-5%] right-[-10%] h-72 w-72 rounded-full bg-sky-200/40 blur-3xl sm:h-96 sm:w-96" />
        </div>
        <div
          className={`relative mx-auto max-w-7xl rounded-3xl border border-zinc-200/90 bg-white/95 px-5 py-9 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_12px_40px_-12px_rgba(16,185,129,0.15)] backdrop-blur-sm sm:px-8 sm:py-11 lg:px-12 lg:py-12`}
        >
          <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:items-stretch lg:gap-12">
            <div className="flex flex-col justify-center">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 sm:text-xs">
                <Star className="size-3.5 shrink-0 text-emerald-600" aria-hidden />
                Chef crafted · Fresh · Warm service
              </span>
              <h1 className="mt-5 text-[1.65rem] font-bold leading-[1.12] tracking-tight text-zinc-900 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.08]">
                Delicious meals,
                <span className="mt-1 block text-emerald-600 sm:mt-0 sm:inline sm:before:content-['\00a0']">
                  ready when you are
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-600 sm:text-base">
                Explore kitchen specials, book a table, or order for takeaway and delivery — all in one place.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={() => setOrderTypeModalOpen(true)}
                  className={`cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-emerald-600/15 transition-all hover:bg-emerald-400 active:scale-[0.98] ${focusRing}`}
                >
                  Start ordering <ChevronRight className="size-4 shrink-0" aria-hidden />
                </button>
                <Link
                  href="/order/table-booking"
                  className={`cursor-pointer inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 ${focusRing}`}
                >
                  <CalendarClock className="size-4 shrink-0 text-zinc-500" aria-hidden />
                  Book a table
                </Link>
              </div>
              <p className="mt-5 max-w-md text-xs leading-relaxed text-zinc-500 sm:text-[13px]">
                <span className="font-medium text-zinc-600">Open daily</span> · 11:00 AM – 11:00 PM · 123 Restaurant Street, Food City
              </p>
            </div>

            <aside className="flex flex-col justify-center rounded-2xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50/90 to-white p-5 shadow-inner ring-1 ring-zinc-100 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Today&apos;s highlight</p>
              {heroDish ? (
                <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                  <SafeDishImage
                    src={heroDish.image}
                    alt=""
                    className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-auto sm:min-h-[7.5rem] sm:w-32 sm:max-w-[40%]"
                    iconClassName="size-11 text-emerald-600/40"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-lg font-bold leading-snug text-zinc-900">{heroDish.name}</p>
                    <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-zinc-600">{heroDish.description}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
                      <span className="text-base font-bold tabular-nums text-emerald-700">
                        {formatCustomerMoney(heroDish.price ?? 0)}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {heroDish.prepTime != null ? `${heroDish.prepTime} min` : "Fresh"}
                      </span>
                    </div>
                    <Link
                      href="/order/menu"
                      className="mt-3 inline-flex w-fit items-center gap-1 text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline"
                    >
                      View on menu <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                  Chef specials are being updated.{" "}
                  <Link href="/order/menu" className="font-semibold text-emerald-700 underline-offset-2 hover:underline">
                    Browse the full menu
                  </Link>{" "}
                  for fresh picks.
                </p>
              )}
            </aside>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { value: "50+", label: "Signature dishes" },
              { value: "4.9★", label: "Guest rating" },
              { value: "20 min", label: "Avg. kitchen prep" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-4 text-center ring-1 ring-white/60 sm:py-5"
              >
                <p className="text-lg font-bold tabular-nums text-emerald-700 sm:text-xl">{s.value}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Order type */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">How you dine</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">How do you want to order?</h2>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base">Pick one — you can change it anytime before checkout.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {CUSTOMER_ORDER_TYPES.map((type) => {
            const ui = ORDER_TYPE_UI[type.id];
            const Icon = ui.Icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => handleOrderType(type.id)}
                className={`cursor-pointer group flex min-h-[168px] flex-col rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${ui.container} ${focusRing}`}
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${ui.iconWrap}`}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-bold text-zinc-900">{type.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{type.description}</p>
                <span className={`mt-4 inline-flex items-center gap-1 text-xs font-semibold ${ui.textAccent}`}>
                  Start ordering <ChevronRight className="size-3.5" aria-hidden />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Browse</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Popular categories</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {CUSTOMER_HOME_CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/order/menu"
              className={`cursor-pointer group flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-[132px] sm:gap-3 sm:p-6 ${cat.color} ${focusRing}`}
            >
              <span className="text-2xl transition-transform duration-200 group-hover:scale-110 sm:text-3xl" aria-hidden>
                {cat.emoji}
              </span>
              <span className="text-xs font-semibold leading-tight sm:text-sm">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Chef&apos;s pick</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Featured dishes</h2>
            </div>
            <Link
              href="/order/menu"
              className={`inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800 ${focusRing} rounded-lg`}
            >
              View full menu <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 sm:aspect-video">
                  <SafeDishImage
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    iconClassName="size-14 text-emerald-600/35"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/35 via-transparent to-transparent" />
                  {item.badge && (
                    <span className="absolute left-3 top-3 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-zinc-950 shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1 text-sm font-bold tabular-nums text-emerald-700 shadow-sm backdrop-blur-sm">
                    {formatCustomerMoney(item.price ?? 0)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-semibold leading-snug text-zinc-900">{item.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 sm:text-sm">{item.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                      {(item.prepTime ?? 99) < 10 ? (
                        <Zap className="size-3.5 shrink-0 text-amber-500" aria-hidden />
                      ) : (
                        <Clock className="size-3.5 shrink-0 text-zinc-400" aria-hidden />
                      )}
                      {item.prepTime != null ? `${item.prepTime} min` : "—"}
                    </span>
                    <Link
                      href="/order/menu"
                      className={`rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-zinc-950 shadow-sm transition-colors hover:bg-emerald-400 ${focusRing}`}
                    >
                      Add to order
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* How it works — horizontal scroll on small screens */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Simple process</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">How it works</h2>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base">From browsing to enjoying — quick and clear.</p>
        </div>
        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory sm:mx-0 sm:px-0 lg:grid lg:grid-cols-5 lg:gap-4 lg:overflow-visible lg:pb-0 lg:pt-0">
          {CUSTOMER_HOME_STEPS.map(({ n, title, text, icon }) => {
            const Icon = STEP_ICON_MAP[icon] ?? LayoutGrid;
            return (
              <div
                key={n}
                className="min-w-[min(100%,260px)] shrink-0 snap-center rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-50 transition-all duration-200 hover:border-emerald-500/25 hover:shadow-md sm:min-w-[240px] lg:min-w-0"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-widest text-emerald-600">{n}</p>
                <h3 className="mt-1 text-sm font-semibold leading-snug text-zinc-900">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">{text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">Reviews</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">What customers say</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3 md:gap-5">
          {CUSTOMER_HOME_REVIEWS.map((r) => (
            <blockquote
              key={r.name}
              className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
            >
              <div className="flex gap-0.5 text-amber-400" aria-label="5 out of 5 stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400" aria-hidden />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-zinc-700">&ldquo;{r.quote}&rdquo;</p>
              <footer className="mt-4 border-t border-zinc-100 pt-4">
                <cite className="not-italic">
                  <p className="text-sm font-semibold text-zinc-900">{r.name}</p>
                  <p className="text-xs text-zinc-600">{r.role}</p>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-500 p-7 text-center shadow-lg shadow-emerald-900/10 sm:p-9 md:flex md:items-center md:justify-between md:gap-8 md:text-left">
          <div className="max-w-lg md:mx-0">
            <h3 className="text-xl font-bold text-white sm:text-2xl">Ready to order?</h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-100/95">Fresh food, straightforward checkout, and updates you can trust.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-0 md:shrink-0">
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className={`cursor-pointer inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-emerald-700 shadow-md transition-colors hover:bg-emerald-50 ${focusRing}`}
            >
              Order now
            </button>
            <Link
              href="/order/table-booking"
              className={`cursor-pointer inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/35 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 ${focusRing}`}
            >
              Book table
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
