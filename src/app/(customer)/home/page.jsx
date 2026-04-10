"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { Bike, CalendarClock, ChevronRight, Clock, ConciergeBell, Star, Store, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
      {/* ── Hero ── */}
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
          <div className="mt-6 grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { value: "50+", label: "Menu Items" },
              { value: "4.9★", label: "Rating" },
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

      {/* ── Order type cards ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-zinc-100">How do you want to order?</h2>
          <p className="mt-2 text-sm text-zinc-500">Choose your preferred way to enjoy our food</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">

          {/* Dine-In */}
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

          {/* Takeaway */}
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

          {/* Delivery */}
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

      {/* ── Featured dishes ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">Featured Dishes</h2>
              <p className="mt-1 text-sm text-zinc-500">Our most loved items</p>
            </div>
            <Link href="/order/menu" className="cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300">
              View full menu →
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
                    ${item.price.toFixed(2)}
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

      {/* ── CTA banner ── */}
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
            <Link href="/order/table-booking" className="cursor-pointer rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20">
              Book Table
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
