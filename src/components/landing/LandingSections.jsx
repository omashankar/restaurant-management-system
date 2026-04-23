import { CheckCircle2, MonitorSmartphone, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import CTASection from "./CTASection";
import DemoSection from "./DemoSection";
import FeatureSection from "./FeatureSection";
import HeroSection from "./HeroSection";
import PricingSection from "./PricingSection";
import RoleSection from "./RoleSection";
import SectionTitle from "./SectionTitle";
import TestimonialSection from "./TestimonialSection";
import { STEP_FLOW } from "./data";

/* ── Brand strip data ── */
const BRANDS = ["Urban Spoon", "Blue Fork", "TasteHub", "Mango Tree", "KitchenCraft"];

/* ── Problem / Solution data ── */
const PROBLEMS = [
  "Managing orders manually causes delays and billing errors",
  "Inventory runs out unexpectedly during peak hours",
  "Staff coordination is messy without a clear system",
  "No visibility into daily sales or performance trends",
];

const BENEFITS = [
  { icon: TrendingUp,   label: "Reduce billing time by up to 60%"       },
  { icon: CheckCircle2, label: "Zero stock surprises with live alerts"   },
  { icon: CheckCircle2, label: "One screen for all order types"          },
  { icon: CheckCircle2, label: "Role-based access keeps teams focused"   },
  { icon: CheckCircle2, label: "Clean reports for faster decisions"      },
];

export default function LandingSections() {
  return (
    <>
      {/* 1 ── HERO */}
      <section id="home" className="scroll-mt-16">
        <HeroSection />
      </section>

      {/* 2 ── BRAND STRIP */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-4 px-4 sm:px-6 lg:px-8">
          <p className="w-full text-center text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-auto">
            Trusted by
          </p>
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-500"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* 3 ── PROBLEM / SOLUTION */}
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
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-500">
                      ✕
                    </span>
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
                One platform for POS, inventory, tables, reservations, staff, and analytics —
                so your team can focus on great food and service.
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

      {/* 4 ── HOW IT WORKS */}
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

      {/* 5 ── FEATURES */}
      <section id="features" className="scroll-mt-16">
        <FeatureSection />
      </section>

      {/* 6 ── ROLES */}
      <RoleSection />

      {/* 7 ── RESPONSIVE + BENEFITS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mobile-first card */}
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <MonitorSmartphone className="size-3.5" /> Works on all devices
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
              Mobile-first, desktop-ready
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Adaptive layout for desktop, tablet, and phone — fast and clean during busy service hours.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Desktop", size: "size-5" },
                { label: "Tablet",  size: "size-4" },
                { label: "Mobile",  size: "size-3.5" },
              ].map(({ label, size }) => (
                <div key={label} className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400">
                  <MonitorSmartphone className={`${size} text-indigo-400`} />
                  {label}
                </div>
              ))}
            </div>
          </article>

          {/* Why RMS card */}
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Star className="size-3.5" /> Why RMS
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
              Built to save time daily
            </h3>
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

      {/* 8 ── PRICING */}
      <section id="pricing" className="scroll-mt-16">
        <PricingSection />
      </section>

      {/* 9 ── DEMO / DASHBOARD PREVIEW */}
      <DemoSection />

      {/* 10 ── TESTIMONIALS */}
      <TestimonialSection />

      {/* 11 ── CTA BANNER */}
      <section id="contact" className="scroll-mt-16">
        <CTASection />
      </section>
    </>
  );
}
