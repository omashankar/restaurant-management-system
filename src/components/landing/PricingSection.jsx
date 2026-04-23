"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import SectionTitle from "./SectionTitle";
import { PRICING_PLANS } from "./data";

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="bg-slate-50 py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Pricing"
          title="Simple, transparent pricing"
          subtext="Choose the plan that fits your restaurant. Upgrade or downgrade anytime."
        />

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-slate-900" : "text-slate-400"}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setYearly((v) => !v)}
            className={`cursor-pointer relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${yearly ? "bg-indigo-600" : "bg-slate-300"}`}
            aria-label="Toggle billing cycle"
          >
            <span className={`inline-block size-4 rounded-full bg-white shadow transition-transform duration-200 ${yearly ? "translate-x-6" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-slate-900" : "text-slate-400"}`}>
            Yearly
            <span className="ml-1.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
              Save 20%
            </span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all duration-200 hover:-translate-y-1 ${
                plan.highlight
                  ? "border-indigo-500 bg-indigo-600 shadow-2xl shadow-indigo-500/30"
                  : "border-slate-200 bg-white shadow-sm hover:shadow-lg hover:shadow-slate-200/60"
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-amber-900 shadow">
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name + price */}
              <div>
                <p className={`text-sm font-bold uppercase tracking-widest ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>
                  {plan.name}
                </p>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-extrabold tabular-nums ${plan.highlight ? "text-white" : "text-slate-900"}`}>
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className={`mb-1 text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>/mo</span>
                </div>
                {yearly && (
                  <p className={`mt-0.5 text-xs ${plan.highlight ? "text-indigo-200" : "text-slate-400"}`}>
                    Billed ${(yearly ? plan.price.yearly : plan.price.monthly) * 12}/year
                  </p>
                )}
                <p className={`mt-3 text-sm leading-relaxed ${plan.highlight ? "text-indigo-100" : "text-slate-600"}`}>
                  {plan.description}
                </p>
              </div>

              {/* Divider */}
              <div className={`my-6 h-px ${plan.highlight ? "bg-indigo-500" : "bg-slate-100"}`} />

              {/* Features */}
              <ul className="flex-1 space-y-3">
                {plan.features.map((f) => (
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

              {/* CTA */}
              <Link
                href="/signup"
                className={`cursor-pointer mt-8 block w-full rounded-xl px-5 py-3 text-center text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                  plan.highlight
                    ? "bg-white text-indigo-700 shadow-lg hover:bg-indigo-50"
                    : "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500"
                }`}
              >
                {plan.cta}
              </Link>
            </article>
          ))}
        </div>

        {/* Bottom note */}
        <p className="mt-8 text-center text-xs text-slate-400">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </section>
  );
}
