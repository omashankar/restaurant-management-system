/**
 * Root landing page — async Server Component.
 *
 * Fetches content directly from landing service + plans collection.
 * Redirects authenticated users server-side to their role dashboard.
 *
 * Rendering strategy:
 *   - revalidate: 60  → ISR — page rebuilds every 60 s in production
 *   - Falls back to static defaults if the API is unavailable
 */

import AboutSection from "@/components/landing/AboutSection";
import ContactSection from "@/components/landing/ContactSection";
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
import { getIcon } from "@/lib/iconMap";
import SectionTitle from "@/components/landing/SectionTitle";
import { TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { getLandingContent as getLandingContentFromService } from "@/lib/landingService";
import clientPromise from "@/lib/mongodb";
import { CheckCircle2, MonitorSmartphone, Star, TrendingUp } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

function redirectForRole(role) {
  switch (role) {
    case "super_admin": return "/super-admin/dashboard";
    case "admin": return "/admin/dashboard";
    case "manager": return "/manager/dashboard";
    case "waiter": return "/waiter/dashboard";
    case "chef": return "/chef/dashboard";
    default: return "/dashboard";
  }
}

function mapPlansToLandingPricing(plans = []) {
  return plans.map((plan, index) => {
    const normalizedPrice = Number(plan.price) || 0;
    const monthly = Number.isFinite(Number(plan.monthlyPrice))
      ? Number(plan.monthlyPrice)
      : (plan.billingCycle === "yearly"
        ? Number((normalizedPrice / 12).toFixed(2))
        : normalizedPrice);
    const yearly = Number.isFinite(Number(plan.yearlyPrice))
      ? Number(plan.yearlyPrice)
      : (plan.billingCycle === "yearly"
        ? normalizedPrice
        : Number((normalizedPrice * 12).toFixed(2)));
    return {
      id: plan.slug || String(plan._id),
      order: index + 1,
      name: plan.name,
      slug: plan.slug,
      price: { monthly, yearly },
      description: plan.description ?? "",
      highlight: plan.slug === "pro",
      badge: plan.slug === "pro" ? "Most Popular" : null,
      cta: "Start Free Trial",
      features: Array.isArray(plan.features)
        ? plan.features.map((feature) => ({ text: String(feature), included: true }))
        : [],
    };
  });
}

/* ── Fetch landing page content directly (no internal HTTP hop) ── */
const getLandingContent = cache(async function getLandingContent() {
  const isProdBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  // Keep production builds deterministic even when external DB is unavailable.
  if (isProdBuildPhase) {
    return null;
  }

  try {
    const [{ content }, client] = await Promise.all([
      getLandingContentFromService(),
      clientPromise,
    ]);
    const db = client.db();
    const plans = await db.collection("plans")
      .find({ isActive: { $ne: false } })
      .sort({ price: 1 })
      .toArray();
    const pricing = mapPlansToLandingPricing(plans);
    return {
      ...content,
      pricing: pricing.length > 0 ? pricing : content?.pricing ?? [],
    };
  } catch (err) {
    if (!isProdBuildPhase) {
      console.error("getLandingContent error:", err.message);
    }
    return null; // components fall back to their own defaults
  }
});

export async function generateMetadata() {
  const content = await getLandingContent();
  const seo = content?.seo ?? {};
  const title = seo.title || "Restaurant OS — All-in-One Restaurant Management System";
  const description = seo.description || "Manage billing, inventory, staff, and analytics from one powerful platform.";
  const keywords = seo.keywords || "restaurant management, POS, inventory, staff management, SaaS";

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      images: seo.ogImage ? [{ url: seo.ogImage }] : [],
    },
    twitter: {
      card: seo.twitterCard || "summary_large_image",
      title,
      description,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
  };
}

/* ════════════════════════════════════════
   PAGE — async server component
════════════════════════════════════════ */
export default async function Home() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const payload = token ? verifyToken(token) : null;
  if (payload?.role) {
    redirect(redirectForRole(payload.role));
  }

  /* Fetch CMS content on the server — no client JS needed */
  const content = await getLandingContent();
  const brands = content?.brands?.items ?? [];
  const problemSolution = content?.problemSolution ?? {};
  const howItWorks = content?.howItWorks ?? {};
  const benefits = content?.benefits ?? {};

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Navbar ── */}
      <LandingNavbar navbar={content?.navbar} />

      {/* ── 1. Hero — dynamic from CMS ── */}
      <section id="home" className="scroll-mt-16">
        <DynamicHero hero={content?.hero} />
      </section>

      {/* ── 2. Brand strip — static ── */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-4 px-4 sm:px-6 lg:px-8">
          <p className="w-full text-center text-xs font-semibold uppercase tracking-widest text-slate-400 sm:w-auto">
            {content?.brands?.eyebrow ?? "Trusted by"}
          </p>
          {brands.map((brand) => (
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
              <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">{problemSolution.problemEyebrow ?? "The Problem"}</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{problemSolution.problemTitle ?? "Running a restaurant is hard"}</h3>
              <ul className="mt-5 space-y-3">
                {(problemSolution.problems ?? []).map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-500">✕</span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{problemSolution.solutionEyebrow ?? "The Solution"}</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{problemSolution.solutionTitle ?? "RMS handles it all"}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {problemSolution.solutionDescription ?? "One platform for POS, inventory, tables, reservations, staff, and analytics."}
              </p>
              <ul className="mt-5 space-y-3">
                {(problemSolution.solutionPoints ?? []).map((label) => (
                  <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="size-3.5" />
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
          eyebrow={howItWorks.eyebrow ?? "How It Works"}
          title={howItWorks.title ?? "From setup to service in minutes"}
          subtext={howItWorks.subtext ?? "Follow the same flow your team uses every day."}
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {(howItWorks.steps ?? []).map(({ n, title, text, icon }, i) => {
            const Icon = getIcon(icon);
            return (
            <article key={n}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg">
              {i < (howItWorks.steps?.length ?? 0) - 1 && (
                <div className="absolute -right-2 top-8 hidden h-0.5 w-4 bg-slate-200 lg:block" />
              )}
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-bold tracking-[0.2em] text-indigo-500">{n}</p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{text}</p>
            </article>
          );})}
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
              <MonitorSmartphone className="size-3.5" /> {benefits.deviceBadge ?? "Works on all devices"}
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{benefits.deviceTitle ?? "Mobile-first, desktop-ready"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {benefits.deviceDescription ?? "Adaptive layout for desktop, tablet, and phone — fast and clean during busy service hours."}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Star className="size-3.5" /> {benefits.whyBadge ?? "Why RMS"}
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{benefits.whyTitle ?? "Built to save time daily"}</h3>
            <ul className="mt-5 space-y-3">
              {(benefits.items ?? []).map((label) => (
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

      {/* ── 9. About — dynamic from CMS ── */}
      <AboutSection about={content?.about} />

      {/* ── 10. Demo — static ── */}
      {content?.demo?.enabled !== false && (
        <section id={content?.demo?.sectionId ?? "demo"} className="scroll-mt-16">
          <DemoSection />
        </section>
      )}

      {/* ── 11. Testimonials — dynamic from CMS ── */}
      <DynamicTestimonials testimonials={content?.testimonials} />

      {/* ── 12. Contact — dynamic from CMS ── */}
      <ContactSection contact={content?.contact} />

      {/* ── 13. CTA — static ── */}
      {content?.cta?.enabled !== false && (
        <section id={content?.cta?.sectionId ?? "cta"} className="scroll-mt-16">
          <CTASection />
        </section>
      )}

      {/* ── Footer — dynamic from CMS ── */}
      <DynamicFooter footer={content?.footer} />
    </main>
  );
}
