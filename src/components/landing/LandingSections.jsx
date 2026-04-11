import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  MonitorSmartphone,
  PackageSearch,
  PlayCircle,
  Sparkles,
  Star,
  Table2,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import SectionTitle from "./SectionTitle";
import { FEATURES, ROLES, STEP_FLOW, TESTIMONIALS } from "./data";

const TRUST_METRICS = [
  { label: "Restaurants onboarded", value: "50+" },
  { label: "Avg. setup time", value: "15 mins" },
  { label: "Uptime", value: "99.9%" },
];

const PROBLEMS = [
  "Managing orders manually causes delays and billing errors",
  "Inventory runs out unexpectedly during peak hours",
  "Staff coordination is messy without a clear system",
  "No visibility into daily sales or performance trends",
];

const BENEFITS = [
  { icon: Zap,        label: "Save time on every order" },
  { icon: TrendingUp, label: "Increase revenue with insights" },
  { icon: CheckCircle2, label: "Reduce billing errors to zero" },
  { icon: Users,      label: "Better team coordination" },
];

export default function LandingSections() {
  return (
    <>
      {/* ══ HERO ══ */}
      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-indigo-100/60 via-slate-50 to-transparent" />

        <div className="flex flex-col justify-center space-y-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <Sparkles className="size-3.5" />
            Built for modern restaurants
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
            All-in-One{" "}
            <span className="text-indigo-600">Restaurant</span>{" "}
            Management System
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-slate-600">
            Manage orders, tables, inventory, and staff from one powerful platform — built for speed and simplicity.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="cursor-pointer inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Get Started Free <ArrowRight className="size-4" />
            </Link>
            <a
              href="#demo"
              className="cursor-pointer inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <PlayCircle className="size-4 text-indigo-500" />
              View Demo
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

        {/* Dashboard mockup */}
        <div className="relative flex items-center">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-100 via-white to-indigo-50 blur-3xl opacity-80" />
          <div className="w-full rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-2xl shadow-indigo-100/60 backdrop-blur-xl">
            {/* Top bar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500">Live Dashboard</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" />
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
                    { label: "Table 3 · Pasta x2",      badge: "Ready",   color: "bg-emerald-100 text-emerald-700" },
                    { label: "Delivery · Burger Combo",  badge: "In Prep", color: "bg-amber-100 text-amber-700" },
                    { label: "Takeaway · Iced Latte",    badge: "Packed",  color: "bg-indigo-100 text-indigo-700" },
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

      {/* ══ BRAND STRIP ══ */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-4 px-4 sm:px-6 lg:px-8">
          <p className="w-full text-center text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-auto">Trusted by</p>
          {["Urban Spoon", "Blue Fork", "TasteHub", "Mango Tree", "KitchenCraft"].map((brand) => (
            <span key={brand} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-500">
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* ══ PROBLEM / SOLUTION ══ */}
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Problem */}
            <article className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">The Problem</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Running a restaurant is hard</h3>
              <ul className="mt-5 space-y-3">
                {PROBLEMS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-500 text-xs font-bold">✕</span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
            {/* Solution */}
            <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">The Solution</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">RMS handles it all</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                One platform for POS, inventory, tables, reservations, staff, and analytics — so your team can focus on great food and service.
              </p>
              <ul className="mt-5 space-y-3">
                {BENEFITS.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <Icon className="size-3.5" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="How It Works"
          title="From setup to service in minutes"
          subtext="Follow the same flow your team uses every day — from configuration to reporting."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {STEP_FLOW.map(({ n, title, text, Icon }, i) => (
            <article
              key={n}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
            >
              {/* connector line */}
              {i < STEP_FLOW.length - 1 && (
                <div className="absolute -right-2 top-8 hidden h-0.5 w-4 bg-slate-200 lg:block" />
              )}
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-bold tracking-[0.2em] text-indigo-500">{n}</p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Core Features"
            title="Everything needed to run a modern restaurant"
            subtext="Purpose-built modules for front-of-house, kitchen, and management teams."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ title, desc, Icon }) => (
              <article
                key={title}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-lg"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DEMO / DASHBOARD PREVIEW ══ */}
      <section id="demo" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Dashboard Preview"
          title="A control center for operations and growth"
          subtext="Monitor performance, track orders, and catch inventory risks before they become issues."
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Sales Overview</p>
              <BarChart3 className="size-4 text-indigo-400" />
            </div>
            <div className="mt-4 flex items-end gap-1 h-32">
              {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 rounded-t-md bg-indigo-100 transition-all hover:bg-indigo-500" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Last 7 days performance</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Live Orders</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500" /> Live
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { id: "#1043", label: "Table 6 · Pasta",    status: "Ready",   c: "bg-emerald-100 text-emerald-700" },
                { id: "#1044", label: "Delivery · Burger",  status: "In Prep", c: "bg-amber-100 text-amber-700" },
                { id: "#1045", label: "Takeaway · Latte",   status: "Packed",  c: "bg-indigo-100 text-indigo-700" },
              ].map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-400">{o.id}</span>
                    <p className="text-slate-700">{o.label}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.c}`}>{o.status}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Inventory Alerts</p>
              <PackageSearch className="size-4 text-amber-400" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-rose-700">
                <span className="size-2 rounded-full bg-rose-500" /> Tomatoes: out of stock
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
                <span className="size-2 rounded-full bg-amber-500" /> Olive Oil: low stock
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500" /> Coffee Beans: OK
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">Stock Health</p>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                <div className="h-2 w-2/3 rounded-full bg-indigo-500" />
              </div>
              <p className="mt-1 text-xs text-slate-500">68% items in stock</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ ROLES ══ */}
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Role-Based Access"
            title="Right tools for every team member"
            subtext="Keep workflows focused and secure with role-based dashboards and permissions."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ role, desc, Icon }) => (
              <article
                key={role}
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-lg"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:ring-indigo-600">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">{role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ══ RESPONSIVE + BENEFITS ══ */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <MonitorSmartphone className="size-3.5" /> Works on all devices
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Mobile-first, desktop-ready</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Adaptive layout for desktop, tablet, and phone — fast and clean during busy service hours.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                <MonitorSmartphone className="size-5 text-indigo-400" /> Desktop
              </div>
              <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-400">
                <MonitorSmartphone className="size-4 text-indigo-300" /> Tablet
              </div>
              <div className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                <MonitorSmartphone className="size-3.5 text-indigo-200" /> Mobile
              </div>
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Star className="size-3.5" /> Why RMS
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Built to save time daily</h3>
            <ul className="mt-5 space-y-3">
              {[
                "Reduce billing time by up to 60%",
                "Zero stock surprises with live alerts",
                "One screen for all order types",
                "Role-based access keeps teams focused",
                "Clean reports for faster decisions",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500 p-10 shadow-2xl shadow-indigo-500/30 md:flex md:items-center md:justify-between">
          <div className="pointer-events-none absolute -right-10 -top-10 size-64 rounded-full bg-white/5 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-20 size-48 rounded-full bg-indigo-400/20 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">Get Started Today</p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              Start Managing Your Restaurant
            </h3>
            <p className="mt-2 text-sm text-indigo-100">
              Launch your modern operations stack in minutes. No credit card required.
            </p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3 md:mt-0 md:shrink-0">
            <Link
              href="/signup"
              className="cursor-pointer rounded-xl bg-white px-6 py-3 text-sm font-bold text-indigo-700 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
            >
              Get Started Free
            </Link>
            <a
              href="#demo"
              className="cursor-pointer rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
            >
              View Demo
            </a>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Testimonials"
          title="Loved by restaurant teams"
          subtext="Real feedback from teams using RMS to run daily operations."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
