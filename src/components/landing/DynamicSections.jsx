"use client";

import { Check, Star, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getIcon } from "@/lib/iconMap";
import SectionTitle from "./SectionTitle";

/* ─────────────────────────────────────────
   FEATURES SECTION
───────────────────────────────────────── */
export function DynamicFeatures({ features = [] }) {
  if (!features.length) return null;
  return (
    <section id="features" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Core Features"
          title="Everything needed to run a modern restaurant"
          subtext="Purpose-built modules for front-of-house, kitchen, and management teams."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <article key={f.id ?? f.title}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/50">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
                {(() => { const Icon = getIcon(f.icon); return <Icon className="size-5" />; })()}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   ROLES SECTION
───────────────────────────────────────── */
const ROLE_COLORS = {
  Admin:   "hover:border-indigo-300 hover:bg-indigo-50/80",
  Manager: "hover:border-emerald-300 hover:bg-emerald-50/80",
  Waiter:  "hover:border-sky-300 hover:bg-sky-50/80",
  Chef:    "hover:border-amber-300 hover:bg-amber-50/80",
};

export function DynamicRoles({ roles = [] }) {
  if (!roles.length) return null;
  return (
    <section className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Role-Based Access"
          title="Right tools for every team member"
          subtext="Keep workflows focused and secure with role-based dashboards and permissions."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((r) => (
            <article key={r.id ?? r.role}
              className={`flex flex-col rounded-2xl border border-slate-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${ROLE_COLORS[r.role] ?? "hover:border-slate-300"}`}>
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                {(() => { const Icon = getIcon(r.icon); return <Icon className="size-5" />; })()}
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{r.role}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{r.description}</p>
              {r.permissions?.length > 0 && (
                <ul className="mt-4 flex-1 space-y-1.5 border-t border-slate-100 pt-4">
                  {r.permissions.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="size-1 shrink-0 rounded-full bg-slate-400" />
                      {p}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   PRICING SECTION
───────────────────────────────────────── */
export function DynamicPricing({ pricing = [] }) {
  const [billingCycle, setBillingCycle] = useState("monthly");
  if (!pricing.length) return null;
  return (
    <section id="pricing" className="scroll-mt-16 bg-slate-50 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          subtext="Choose the plan that fits your restaurant. Upgrade or downgrade anytime."
        />
        <div className="mt-6 flex justify-center">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                billingCycle === "monthly" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                billingCycle === "yearly" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {pricing.map((plan) => (
            <article key={plan.id ?? plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-200 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-600 shadow-2xl shadow-indigo-500/30"
                  : "border-slate-200 bg-white shadow-sm hover:shadow-lg"
              }`}>
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-amber-900 shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              <p className={`text-sm font-bold uppercase tracking-widest ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                {plan.name}
              </p>
              <div className="mt-3 flex items-end gap-1">
                <span className={`text-4xl font-extrabold tabular-nums ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                  ${billingCycle === "yearly" ? (plan.price?.yearly ?? plan.price?.monthly ?? 0) : (plan.price?.monthly ?? 0)}
                </span>
                <span className={`mb-1 text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                  /{billingCycle === "yearly" ? "yr" : "mo"}
                </span>
              </div>
              <p className={`mt-3 text-sm leading-relaxed ${plan.highlight ? "text-indigo-100" : "text-slate-600"}`}>
                {plan.description}
              </p>

              <div className={`my-6 h-px ${plan.highlight ? "bg-indigo-500" : "bg-slate-100"}`} />

              <ul className="flex-1 space-y-3">
                {(plan.features ?? []).map((f) => (
                  <li key={f.text} className="flex items-start gap-2.5">
                    {f.included ? (
                      <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${plan.highlight ? "bg-white/20" : "bg-emerald-100"}`}>
                        <Check className={`size-2.5 ${plan.highlight ? "text-white" : "text-emerald-600"}`} strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-slate-100">
                        <X className="size-2.5 text-slate-400" strokeWidth={3} />
                      </span>
                    )}
                    <span className={`text-sm ${
                      f.included
                        ? plan.highlight ? "text-indigo-50" : "text-slate-700"
                        : plan.highlight ? "text-indigo-300/60 line-through" : "text-slate-400 line-through"
                    }`}>
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link href="/signup"
                className={`cursor-pointer mt-8 block w-full rounded-xl px-5 py-3 text-center text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-white text-indigo-700 shadow-lg hover:bg-indigo-50"
                    : "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500"
                }`}>
                {plan.cta ?? "Get Started"}
              </Link>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   TESTIMONIALS SECTION
───────────────────────────────────────── */
export function DynamicTestimonials({ testimonials = [] }) {
  if (!testimonials.length) return null;
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Testimonials"
        title="Loved by restaurant teams"
        subtext="Real feedback from teams using RMS to run daily operations."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <article key={t.id ?? t.name}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="flex gap-0.5">
              {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {t.name?.[0]?.toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}{t.company ? ` · ${t.company}` : ""}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER SECTION (dynamic)
───────────────────────────────────────── */
export function DynamicFooter({ footer = {} }) {
  const {
    companyName = "Restaurant OS",
    tagline     = "",
    email       = "",
    phone       = "",
    address     = "",
    links       = [],
    social      = [],
  } = footer;

  return (
    <footer id="contact" className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="text-sm font-bold tracking-tight text-slate-900">{companyName}</p>
            {tagline && <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">{tagline}</p>}
            <div className="mt-4 space-y-1 text-sm text-slate-500">
              {email   && <p>{email}</p>}
              {phone   && <p>{phone}</p>}
              {address && <p>{address}</p>}
            </div>
            <Link href="/signup"
              className="cursor-pointer mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500">
              Get Started Free
            </Link>
          </div>

          {links.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Links</p>
              <ul className="mt-4 space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="cursor-pointer text-sm text-slate-600 transition-colors hover:text-indigo-600">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Access</p>
            <ul className="mt-4 space-y-3">
              {[
                { label: "Login",        href: "/login"  },
                { label: "Sign Up",      href: "/signup" },
                { label: "Customer App", href: "/home"   },
              ].map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="cursor-pointer text-sm text-slate-600 transition-colors hover:text-indigo-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <a href="#" className="cursor-pointer hover:text-slate-600">Privacy Policy</a>
            <a href="#" className="cursor-pointer hover:text-slate-600">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
