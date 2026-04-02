import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MonitorSmartphone,
  PlayCircle,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import SectionTitle from "./SectionTitle";
import { FEATURES, ROLES, STEP_FLOW, TESTIMONIALS } from "./data";

const TRUST_METRICS = [
  { label: "Restaurants onboarded", value: "50+" },
  { label: "Avg. setup time", value: "15 mins" },
  { label: "Uptime", value: "99.9%" },
];

export default function LandingSections() {
  return (
    <>
      <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 pt-12 sm:px-6 md:pb-16 md:pt-16 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-20">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-indigo-100/70 via-slate-50 to-transparent" />

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Sparkles className="size-3.5" />
            Built for modern restaurants
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            All-in-One Restaurant Management System
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600">
            Manage orders, tables, inventory, and staff with a powerful and easy-to-use platform.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#demo"
              className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
            >
              <PlayCircle className="size-4" />
              View Demo
            </a>
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500"
            >
              Start Now
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-3">
            {TRUST_METRICS.map((m) => (
              <div key={m.label} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-lg font-semibold text-slate-900">{m.value}</p>
                <p className="text-xs text-slate-500">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-100 via-white to-indigo-50 blur-2xl" />
          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-2xl shadow-indigo-100 backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Today Sales</p>
                <p className="mt-2 text-2xl font-semibold">$12,480</p>
                <p className="mt-2 text-xs text-emerald-600">+18.4% vs yesterday</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Orders Live</p>
                <p className="mt-2 text-2xl font-semibold">126</p>
                <p className="mt-2 text-xs text-indigo-600">32 in kitchen queue</p>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">Dashboard UI Preview</p>
                <div className="mt-3 space-y-2">
                  {["Table 3 · Pasta x2", "Delivery · Burger Combo", "Takeaway · Iced Latte"].map((line) => (
                    <div
                      key={line}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>{line}</span>
                      <span className="text-xs text-slate-500">Just now</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
              <h3 className="text-lg font-semibold text-rose-700">Problems restaurants face</h3>
              <ul className="mt-3 space-y-2 text-sm text-rose-800">
                <li>- Managing orders manually is slow</li>
                <li>- Inventory tracking is difficult</li>
                <li>- Staff coordination is messy</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <h3 className="text-lg font-semibold text-emerald-700">RMS solution</h3>
              <p className="mt-3 text-sm text-emerald-800">
                RMS automates everything in one system: POS, inventory, tables, reservations, staff workflows, and reporting.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <SectionTitle
          eyebrow="How It Works"
          title="Real workflow for daily restaurant operations"
          subtext="Follow the same flow your team uses from setup to service and reporting."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {STEP_FLOW.map(({ n, title, text, Icon }) => (
            <article
              key={n}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
            >
              <span className="inline-flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <Icon className="size-4" />
              </span>
              <p className="mt-3 text-xs font-semibold tracking-[0.2em] text-indigo-600">{n}</p>
              <h3 className="mt-1 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Quick Demo</p>
            <h3 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              See RMS in action in under 2 minutes
            </h3>
          </div>
          <a
            href="#demo"
            className="mt-3 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 md:mt-0"
          >
            Try Demo <ArrowRight className="size-4" />
          </a>
        </div>
      </section>

      <section id="features" className="bg-white py-12 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Core Features"
            title="Everything needed to run a modern restaurant"
            subtext="Purpose-built modules for front-of-house, kitchen, and management."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ title, desc, Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
                <div className="mt-4 h-16 rounded-lg border border-slate-200 bg-white" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <SectionTitle
          eyebrow="Role-Based System"
          title="Right access for every team member"
          subtext="Keep workflows focused and secure with role-based dashboards."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {ROLES.map(({ role, desc, Icon }) => (
            <article
              key={role}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 text-base font-semibold">{role}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="demo" className="bg-white py-12 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">POS explained</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Select category
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Add items
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Choose order type
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Place order
                </li>
              </ul>
              <div className="mt-5 h-40 rounded-xl border border-slate-200 bg-white" />
            </article>
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Inventory & alerts</h3>
              <p className="mt-2 text-sm text-slate-600">
                Track stock levels, get low-stock alerts, and avoid shortages before service rush.
              </p>
              <div className="mt-5 space-y-2 text-sm">
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">Olive Oil: low stock</div>
                <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">Tomatoes: out of stock</div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">Coffee Beans: replenished</div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <MonitorSmartphone className="size-3.5" /> Responsive & Easy to Use
            </span>
            <p className="mt-3 text-sm text-slate-600">
              Works on desktop, tablet, and mobile with a clean fast interface for busy service hours.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-20 rounded-xl border border-slate-200 bg-slate-50" />
              <div className="h-20 rounded-xl border border-slate-200 bg-slate-100" />
              <div className="h-20 rounded-xl border border-slate-200 bg-slate-50" />
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">Benefits</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {["Save time", "Reduce errors", "Increase efficiency", "Better customer service"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-8 text-white shadow-xl shadow-indigo-500/30 md:flex md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Start Managing Your Restaurant Today</h3>
            <p className="mt-2 text-sm text-indigo-100">Try live demo and experience faster operations.</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
            <a
              href="#demo"
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Try Live Demo
            </a>
            <Link
              href="/signup"
              className="rounded-xl border border-indigo-200/40 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500/40"
            >
              Start Managing Now
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Testimonials"
          title="Trusted by restaurant teams"
          subtext="Demo testimonials for your product presentation."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
            >
              <p className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
