import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import { CheckCircle2, Monitor, Smartphone, Star, Tablet } from "lucide-react";
import SectionTitle from "./SectionTitle";

export default function BenefitsSection({ data = {} }) {
  const {
    sectionEyebrow = `Why teams choose ${BHOJDESK_BRAND.name}`,
    sectionTitle = "Built for speed on every screen",
    sectionSubtext = "Your staff moves fast — your software should keep up during lunch rush and late-night service.",
    deviceBadge = "Works on all devices",
    deviceTitle = "Mobile-first, desktop-ready",
    deviceDescription = "Adaptive layout for desktop, tablet, and phone — fast and clean during busy service hours.",
    whyBadge = `Why ${BHOJDESK_BRAND.name}`,
    whyTitle = "Built to save time daily",
    items = [],
  } = data;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={sectionEyebrow} title={sectionTitle} subtext={sectionSubtext} />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-sm sm:p-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700">
              <Smartphone className="size-3.5" aria-hidden />
              {deviceBadge}
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{deviceTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{deviceDescription}</p>

            <div className="mt-6 flex flex-wrap items-end justify-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-16 w-10 items-center justify-center rounded-xl border-2 border-slate-300 bg-white shadow-sm">
                  <Smartphone className="size-4 text-indigo-500" />
                </div>
                <span className="text-[10px] font-medium text-slate-400">Phone</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-14 w-20 items-center justify-center rounded-xl border-2 border-slate-300 bg-white shadow-sm">
                  <Tablet className="size-5 text-indigo-500" />
                </div>
                <span className="text-[10px] font-medium text-slate-400">Tablet</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex h-12 w-24 items-center justify-center rounded-lg border-2 border-indigo-300 bg-indigo-50 shadow-md">
                  <Monitor className="size-5 text-indigo-600" />
                </div>
                <span className="text-[10px] font-medium text-indigo-600">Desktop</span>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Star className="size-3.5" aria-hidden />
              {whyBadge}
            </span>
            <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-900">{whyTitle}</h3>
            <ul className="mt-5 space-y-2.5">
              {items.map((label) => (
                <li
                  key={label}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  {label}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
