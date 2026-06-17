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

import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import AboutSection from "@/components/landing/AboutSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import BrandMarquee from "@/components/landing/BrandMarquee";
import ContactSection from "@/components/landing/ContactSection";
import FaqSection from "@/components/landing/FaqSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingPreviewBanner from "@/components/landing/LandingPreviewBanner";
import LandingStickyCta from "@/components/landing/LandingStickyCta";
import LandingTrustBar from "@/components/landing/LandingTrustBar";
import ProblemSolutionSection from "@/components/landing/ProblemSolutionSection";
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
import { TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import {
  getLandingContent as getLandingContentFromService,
  mergeWithDefaults,
} from "@/lib/landingService";
import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";

function redirectForRole(role) {
  switch (role) {
    case "super_admin": return "/super-admin/dashboard";
    case "admin": return "/dashboard";
    case "manager": return "/dashboard";
    case "waiter": return "/dashboard";
    case "chef": return "/kitchen";
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
      id: plan._id ? String(plan._id) : `${plan.slug ?? "plan"}-${index}`,
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

async function plansPricingFromDb(client) {
  const db = client.db();
  const plans = await db
    .collection("plans")
    .find({ isActive: { $ne: false } })
    .sort({ price: 1 })
    .toArray();
  return mapPlansToLandingPricing(plans);
}

/** Fresh fetch — used for ?preview=1 so CMS edits show immediately. */
async function loadLandingContentFresh() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return mergeWithDefaults(null);
  }

  const defaults = mergeWithDefaults(null);

  try {
    const [{ content }, client] = await Promise.all([
      getLandingContentFromService(),
      clientPromise,
    ]);
    const fromPlans = await plansPricingFromDb(client);
    const pricing =
      fromPlans.length > 0 ? fromPlans : content?.pricing?.length ? content.pricing : defaults.pricing;

    return {
      ...content,
      pricing,
    };
  } catch (err) {
    console.error("getLandingContent error:", err.message);
    try {
      const client = await clientPromise;
      const fromPlans = await plansPricingFromDb(client);
      if (fromPlans.length > 0) return { ...defaults, pricing: fromPlans };
    } catch {
      /* use defaults.pricing */
    }
    return defaults;
  }
}

/* ── Fetch landing page content directly (no internal HTTP hop) ── */
const getLandingContent = unstable_cache(loadLandingContentFresh, ["landing-home-content"], {
  tags: ["landing"],
  revalidate: 60,
});

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const isPreviewMode = params?.preview === "1";
  const content = isPreviewMode ? await loadLandingContentFresh() : await getLandingContent();
  const seo = content?.seo ?? {};
  const title = seo.title || BHOJDESK_BRAND.fullName;
  const description = seo.description || "Manage billing, inventory, staff, and analytics from one powerful platform.";
  const keywords = seo.keywords || "restaurant management, POS, inventory, staff management, SaaS";

  return {
    title: isPreviewMode ? `${title} (Preview)` : title,
    description,
    keywords,
    ...(isPreviewMode ? { robots: { index: false, follow: false } } : {}),
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
export default async function Home({ searchParams }) {
  const params = await searchParams;
  const isPreviewMode = params?.preview === "1";
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  const payload = token ? verifyToken(token) : null;
  if (payload?.role && !isPreviewMode) {
    redirect(redirectForRole(payload.role));
  }

  /* Preview skips ISR cache so super-admin edits appear on refresh */
  const content = isPreviewMode ? await loadLandingContentFresh() : await getLandingContent();
  const brands = content?.brands?.items ?? [];
  const problemSolution = content?.problemSolution ?? {};
  const howItWorks = content?.howItWorks ?? {};
  const benefits = content?.benefits ?? {};
  const heroSpotlight = content?.testimonials?.[0] ?? null;
  const currencyCode = content?.seo?.priceCurrency ?? "INR";

  return (
    <main className="min-h-screen min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-slate-50 pb-[4.75rem] text-slate-900 lg:pb-0">
      {isPreviewMode && <LandingPreviewBanner />}
      {/* ── Navbar ── */}
      <LandingNavbar navbar={content?.navbar} />

      {/* ── 1. Hero — dynamic from CMS ── */}
      <section id="home" className="scroll-mt-16">
        <DynamicHero
          hero={content?.hero}
          spotlight={heroSpotlight}
          currencyCode={currencyCode}
        />
      </section>

      {/* ── 2. Trust bar ── */}
      <LandingTrustBar />

      {/* ── 3. Brand strip — marquee ── */}
      <BrandMarquee eyebrow={content?.brands?.eyebrow} brands={brands} />

      {/* ── 4. Problem / Solution ── */}
      <ProblemSolutionSection data={problemSolution} />

      {/* ── 5. How It Works ── */}
      <HowItWorksSection data={howItWorks} />

      {/* ── 6. Features — dynamic from CMS ── */}
      <section id="features" className="scroll-mt-16">
        <DynamicFeatures features={content?.features} />
      </section>

      {/* ── 6. Roles — dynamic from CMS ── */}
      <DynamicRoles roles={content?.roles} />

      {/* ── 7. Benefits ── */}
      <BenefitsSection data={benefits} />

      {/* ── 8. Pricing — dynamic from CMS ── */}
      <section id="pricing" className="scroll-mt-16">
        <DynamicPricing
          pricing={content?.pricing}
          currencyCode={currencyCode}
        />
      </section>

      {/* ── 9. About — dynamic from CMS ── */}
      <AboutSection about={content?.about} />

      {/* ── 10. Demo — static ── */}
      {content?.demo?.enabled !== false && <DemoSection demo={content?.demo} />}

      {/* ── 11. Testimonials — dynamic from CMS ── */}
      <DynamicTestimonials testimonials={content?.testimonials} />

      {/* ── 12. FAQ — objections before contact ── */}
      {content?.faq?.enabled !== false && (
        <FaqSection faq={content?.faq} />
      )}

      {/* ── 13. Contact — dynamic from CMS ── */}
      <ContactSection contact={content?.contact} />

      {/* ── 14. CTA — static ── */}
      {content?.cta?.enabled !== false && (
        <section id={content?.cta?.sectionId ?? "cta"} className="scroll-mt-16">
          <CTASection cta={content?.cta} />
        </section>
      )}

      {/* ── Footer — dynamic from CMS ── */}
      <DynamicFooter footer={content?.footer} />

      <LandingStickyCta
        label={content?.hero?.ctaPrimary ?? "Start Free Trial"}
        note={content?.hero?.trialNote ?? "14-day free trial · No card required"}
      />
    </main>
  );
}
