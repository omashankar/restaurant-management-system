"use client";

import SectionTitle from "./SectionTitle";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function FaqSection({ faq = {} }) {
  const {
    enabled = true,
    eyebrow = "FAQ",
    title = "Common questions",
    subtext = "Everything you need to know before starting your free trial.",
    items = [],
  } = faq;

  const [openIndex, setOpenIndex] = useState(0);

  if (enabled === false || !items.length) return null;

  return (
    <section id="faq" className="scroll-mt-16 bg-gradient-to-b from-white to-slate-50 py-16 sm:py-20">
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={eyebrow} title={title} subtext={subtext} />

        <div className="mt-10 space-y-3">
          {items.map((item, index) => {
            const open = openIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <article
                key={item.id ?? item.q ?? index}
                className={`overflow-hidden rounded-2xl border transition-all duration-200 ${
                  open
                    ? "border-indigo-200 bg-white shadow-md shadow-indigo-100/40"
                    : "border-slate-200 bg-white/80 hover:border-indigo-100"
                }`}
              >
                <button
                  type="button"
                  id={`faq-trigger-${index}`}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? -1 : index)}
                  className="cursor-pointer flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
                >
                  <span className="break-words text-sm font-semibold text-slate-900 sm:text-base">
                    {item.q}
                  </span>
                  <span
                    className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                      open ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <ChevronDown
                      className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`faq-trigger-${index}`}
                  aria-hidden={!open}
                  className={`grid transition-[grid-template-rows] duration-200 ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="break-words border-t border-slate-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-slate-600 sm:px-5">
                      {item.a}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 text-center sm:p-6">
          <span className="mx-auto inline-flex size-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <MessageCircle className="size-5" aria-hidden />
          </span>
          <p className="mt-3 text-base font-semibold text-slate-900">Still have questions?</p>
          <p className="mt-1 text-sm text-slate-600">
            Our team typically replies within one business day.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <a
              href="#contact"
              className="cursor-pointer inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Contact support
            </a>
            <Link
              href="/signup"
              className="cursor-pointer inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              Start free trial
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
