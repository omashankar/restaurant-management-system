import { ArrowRight, CheckCircle2, PlayCircle, Quote, TrendingUp } from "lucide-react";
import Link from "next/link";
import { formatLandingCurrency } from "@/lib/formatLandingCurrency";

function splitHeadline(text = "") {
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= 3) return { lead: text, accent: "" };
  return {
    lead: `${words.slice(0, -2).join(" ")} `,
    accent: words.slice(-2).join(" "),
  };
}

export default function DynamicHero({ hero = {}, spotlight = null, currencyCode = "INR" }) {
  const {
    badge = "Built for modern restaurants",
    headline = "BhojDesk Restaurant Management System",
    subheadline = "Manage billing, inventory, staff, and analytics from one powerful platform.",
    ctaPrimary = "Start Free Trial",
    ctaSecondary = "Book a Demo",
    trialNote = "14-day free trial · No credit card required",
    stats = [],
  } = hero;

  const { lead, accent } = splitHeadline(headline);
  const demoSales = formatLandingCurrency(12480, currencyCode);

  return (
    <div className="relative mx-auto grid w-full min-w-0 max-w-7xl gap-8 px-4 pb-12 pt-12 sm:gap-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-[radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.14),_transparent_55%),radial-gradient(ellipse_at_top_right,_rgba(14,165,233,0.08),_transparent_50%)]" />

      <div className="flex min-w-0 flex-col justify-center space-y-5 sm:space-y-6">
        {badge && (
          <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
            <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-indigo-500" />
            <span className="truncate">{badge}</span>
          </div>
        )}

        <h1 className="break-words text-[1.65rem] font-bold leading-tight tracking-tight text-slate-900 min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
          {lead}
          {accent ? (
            <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
              {accent}
            </span>
          ) : null}
        </h1>

        <p className="max-w-lg break-words text-sm leading-relaxed text-slate-600 sm:text-base md:text-lg">
          {subheadline}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/signup"
            className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-95 sm:w-auto"
          >
            {ctaPrimary} <ArrowRight className="size-4 shrink-0" />
          </Link>
          <a
            href="#demo"
            className="cursor-pointer inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 sm:w-auto"
          >
            <PlayCircle className="size-4 shrink-0 text-indigo-500" />
            {ctaSecondary}
          </a>
        </div>

        {trialNote && (
          <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
            <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" aria-hidden />
            <span className="break-words">{trialNote}</span>
          </p>
        )}

        {stats.length > 0 && (
          <div className="grid min-w-0 grid-cols-3 gap-1.5 pt-1 sm:gap-3">
            {stats.slice(0, 3).map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-xl border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur-sm sm:p-3"
              >
                <p className="truncate text-sm font-bold text-slate-900 sm:text-lg">{s.value}</p>
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-tight text-slate-500 sm:text-xs">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {spotlight?.quote && (
          <blockquote className="hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm md:block md:p-5 lg:max-w-md">
            <Quote className="size-5 text-indigo-400" aria-hidden />
            <p className="mt-2 break-words text-sm leading-relaxed text-slate-700">
              &ldquo;{spotlight.quote}&rdquo;
            </p>
            {(spotlight.name || spotlight.role) && (
              <footer className="mt-3 flex items-center gap-2.5">
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                  {spotlight.name?.[0]?.toUpperCase() ?? "R"}
                </span>
                <div className="min-w-0 text-xs">
                  {spotlight.name && (
                    <p className="truncate font-semibold text-slate-900">{spotlight.name}</p>
                  )}
                  {spotlight.role && (
                    <p className="truncate text-slate-500">{spotlight.role}</p>
                  )}
                </div>
              </footer>
            )}
          </blockquote>
        )}
      </div>

      <div className="relative flex min-w-0 items-center lg:justify-end">
        <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-100 via-white to-indigo-50 blur-3xl opacity-80 sm:-inset-6" />
        <div className="min-w-0 w-full max-w-xl rounded-[1.25rem] border border-slate-200/80 bg-slate-900/95 p-1.5 shadow-2xl shadow-indigo-200/50 sm:rounded-[1.35rem] sm:p-2">
          <div className="mb-1.5 flex min-w-0 items-center gap-1.5 px-1 sm:mb-2">
            <span className="size-2 shrink-0 rounded-full bg-rose-400 sm:size-2.5" />
            <span className="size-2 shrink-0 rounded-full bg-amber-400 sm:size-2.5" />
            <span className="size-2 shrink-0 rounded-full bg-emerald-400 sm:size-2.5" />
            <span className="ml-1 min-w-0 truncate text-[9px] font-medium text-slate-400 sm:ml-2 sm:text-[10px]">
              app.bhojdesk.com/dashboard
            </span>
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3 backdrop-blur-xl sm:rounded-2xl sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <p className="text-xs font-semibold text-slate-500">Live Dashboard</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:gap-1.5 sm:px-2.5 sm:text-xs">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2 sm:gap-3">
              <div className="min-w-0 rounded-xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-3 sm:rounded-2xl sm:p-4">
                <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">Today Sales</p>
                <p className="mt-1 break-all text-lg font-bold text-slate-900 sm:mt-2 sm:text-2xl">
                  {demoSales}
                </p>
                <p className="mt-1 inline-flex flex-wrap items-center gap-1 text-[10px] font-semibold text-emerald-600 sm:mt-1.5 sm:text-xs">
                  <TrendingUp className="size-3 shrink-0" /> +18.4% vs yesterday
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-slate-100 bg-gradient-to-br from-indigo-50 to-white p-3 sm:rounded-2xl sm:p-4">
                <p className="text-[10px] font-semibold text-slate-500 sm:text-xs">Active Orders</p>
                <p className="mt-1 text-lg font-bold text-slate-900 sm:mt-2 sm:text-2xl">126</p>
                <p className="mt-1 text-[10px] font-semibold text-indigo-600 sm:mt-1.5 sm:text-xs">
                  32 in kitchen queue
                </p>
              </div>
              <div className="col-span-1 rounded-xl border border-slate-100 bg-slate-50 p-3 min-[400px]:col-span-2 sm:rounded-2xl sm:p-4">
                <p className="mb-2 text-[10px] font-semibold text-slate-500 sm:mb-3 sm:text-xs">Recent Orders</p>
                <div className="space-y-1.5 sm:space-y-2">
                  {[
                    { label: "Table 3 · Pasta x2", badge: "Ready", color: "bg-emerald-100 text-emerald-700" },
                    { label: "Delivery · Burger Combo", badge: "In Prep", color: "bg-amber-100 text-amber-700" },
                    { label: "Takeaway · Iced Latte", badge: "Packed", color: "bg-indigo-100 text-indigo-700" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-xs shadow-sm sm:px-3 sm:py-2 sm:text-sm"
                    >
                      <span className="min-w-0 truncate text-slate-700">{row.label}</span>
                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:text-xs ${row.color}`}>
                        {row.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
