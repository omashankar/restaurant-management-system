import { ArrowRight, PlayCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

const TRUST_METRICS = [
  { value: "500+",   label: "Restaurants onboarded" },
  { value: "15 min", label: "Avg. setup time"        },
  { value: "99.9%",  label: "Uptime SLA"             },
];

export default function HeroSection() {
  return (
    <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-20">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-indigo-100/60 via-slate-50 to-transparent" />

      {/* ── Left: copy ── */}
      <div className="flex flex-col justify-center space-y-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
          <span className="size-1.5 rounded-full bg-indigo-500" />
          Built for modern restaurants
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          All-in-One{" "}
          <span className="text-indigo-600">Restaurant</span>{" "}
          Management System
        </h1>

        <p className="max-w-lg text-base leading-relaxed text-slate-600">
          Manage billing, inventory, staff, and analytics from one powerful platform —
          built for speed, simplicity, and scale.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="cursor-pointer inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-95"
          >
            Start Free Trial <ArrowRight className="size-4" />
          </Link>
          <a
            href="#demo"
            className="cursor-pointer inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
          >
            <PlayCircle className="size-4 text-indigo-500" />
            Book a Demo
          </a>
        </div>

        {/* Trust metrics */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {TRUST_METRICS.map((m) => (
            <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="text-lg font-bold text-slate-900">{m.value}</p>
              <p className="mt-0.5 text-xs text-slate-500">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: dashboard mockup ── */}
      <div className="relative flex items-center">
        <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-100 via-white to-indigo-50 blur-3xl opacity-80" />
        <div className="w-full rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-indigo-100/60 backdrop-blur-xl">
          {/* Top bar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Live Dashboard</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-4">
              <p className="text-xs font-semibold text-slate-500">Today Sales</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">$12,480</p>
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                <TrendingUp className="size-3" /> +18.4% vs yesterday
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-4">
              <p className="text-xs font-semibold text-slate-500">Active Orders</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">126</p>
              <p className="mt-1.5 text-xs font-semibold text-indigo-600">32 in kitchen queue</p>
            </div>
            <div className="sm:col-span-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold text-slate-500">Recent Orders</p>
              <div className="space-y-2">
                {[
                  { label: "Table 3 · Pasta x2",     badge: "Ready",   color: "bg-emerald-100 text-emerald-700" },
                  { label: "Delivery · Burger Combo", badge: "In Prep", color: "bg-amber-100 text-amber-700"    },
                  { label: "Takeaway · Iced Latte",   badge: "Packed",  color: "bg-indigo-100 text-indigo-700"  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                    <span className="text-slate-700">{row.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.color}`}>{row.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
