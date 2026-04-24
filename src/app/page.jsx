/**
 * Root landing page — async Server Component.
 *
 * Fetches content from /api/landing-page at request time.
 * Passes data down to dynamic section components as props.
 * Auth redirect is handled by the AuthRedirect client component.
 *
 * Rendering strategy:
 *   - revalidate: 60  → ISR — page rebuilds every 60 s in production
 *   - Falls back to static defaults if the API is unavailable
 */

import AuthRedirect from "@/components/landing/AuthRedirect";
import LandingNavbar from "@/components/landing/LandingNavbar";
import {
  DynamicFeatures,
  DynamicFooter,
  DynamicPricing,
  DynamicRoles,
  DynamicTestimonials,
} from "@/components/landing/DynamicSections";
import DynamicHero from "@/components/landing/DynamicHero";
import CTASection from "@/components/landing/CTASection";
import DemoSection from "@/components/landing/DemoSection";
import { STEP_FLOW } from "@/components/landing/data";
import SectionTitle from "@/components/landing/SectionTitle";
import { CheckCircle2, MonitorSmartphone, Star, TrendingUp } from "lucide-react";

/* ── Fetch landing page content from the public API ── */
async function getLandingContent() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/landing-page`, {
      /* Tag this fetch so revalidatePath("/") or revalidateTag("landing")
         purges it instantly when the Super Admin saves content.
         Falls back to 60s ISR if on-demand revalidation is not triggered. */
      next: { revalidate: 60, tags: ["landing"] },
    });

    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const data = await res.json();
    return data.success ? data.content : null;
  } catch (err) {
    console.error("getLandingContent error:", err.message);
    return null; // components fall back to their own defaults
  }
}

/* ── Static data (not from CMS) ── */
const BRANDS   = ["Urban Spoon", "Blue Fork", "TasteHub", "Mango Tree", "KitchenCraft"];
const PROBLEMS = [
  "Managing orders manually causes delays and billing errors",
  "Inventory runs out unexpectedly during peak hours",
  "Staff coordination is messy without a clear system",
  "No visibility into daily sales or performance trends",
];
const BENEFITS = [
  { icon: TrendingUp,   label: "Reduce billing time by up to 60%"     },
  { icon: CheckCircle2, label: "Zero stock surprises with live alerts" },
  { icon: CheckCircle2, label: "One screen for all order types"        },
  { icon: CheckCircle2, label: "Role-based access keeps teams focused" },
  { icon: CheckCircle2, label: "Clean reports for faster decisions"    },
];

/* ════════════════════════════════════════
   PAGE — async server component
════════════════════════════════════════ */
export default async function Home() {
  /* Fetch CMS content on the server — no client JS needed */
  const content = await getLandingContent();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/*
        AuthRedirect is a client component.
        It runs only in the browser and redirects logged-in users
        to their dashboard without blocking the server render.
      */}
      <AuthRedirect />

      {/* ── Navbar ── */}
      <LandingNavbar />

      {/* ── 1. Hero — dynamic from CMS ── */}
      <section id="home" className="scroll-mt-16">
        <DynamicHero hero={content?.hero} />
      </section>

      {/* ── 2. Brand strip — static ── */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-4 px-4 sm:px-6 lg:px-8">
          <p className="w-full text-center text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-auto">
            Trusted by
          </p>
          {BRANDS.map((brand) => (
            <span key={brand} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-500">
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* ── 3. Problem / Solution — static ── */}
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">The Problem</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">Running a restaurant is hard</h3>
              <ul className="mt-5 space-y-3">
                {PROBLEMS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-500">✕</span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">The Solution</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">RMS handles it all</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                One platform for POS, inventory, tables, reservations, staff, and analytics.
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

      {/* ── 4. How It Works — static ── */}
      <section id="how-it-works" className="scroll-mt-16 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="How It Works"
          title="From setup to service in minutes"
          subtext="Follow the same flow your team uses every day."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {STEP_FLOW.map(({ n, title, text, Icon }, i) => (
            <article key={n}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg">
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

      {/* ── 5. Features — dynamic from CMS ── */}
      <section id="features" className="scroll-mt-16">
        <DynamicFeatures features={content?.features} />
      </section>

      {/* ── 6. Roles — dynamic from CMS ── */}
      <DynamicRoles roles={content?.roles} />

      {/* ── 7. Benefits — static ── */}
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
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Star className="size-3.5" /> Why RMS
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Built to save time daily</h3>
            <ul className="mt-5 space-y-3">
              {BENEFITS.map(({ label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />{label}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {/* ── 8. Pricing — dynamic from CMS ── */}
      <section id="pricing" className="scroll-mt-16">
        <DynamicPricing pricing={content?.pricing} />
      </section>

      {/* ── 9. Demo — static ── */}
      <section id="demo" className="scroll-mt-16">
        <DemoSection />
      </section>

      {/* ── 10. Testimonials — dynamic from CMS ── */}
      <DynamicTestimonials testimonials={content?.testimonials} />

      {/* ── 11. CTA — static ── */}
      <section id="contact" className="scroll-mt-16">
        <CTASection />
      </section>

      {/* ── Footer — dynamic from CMS ── */}
      <DynamicFooter footer={content?.footer} />
    </main>
  );
}
