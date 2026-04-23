import { Star } from "lucide-react";
import SectionTitle from "./SectionTitle";
import { TESTIMONIALS } from "./data";

export default function TestimonialSection() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <SectionTitle
        eyebrow="Testimonials"
        title="Loved by restaurant teams"
        subtext="Real feedback from teams using RMS to run daily operations."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <article
            key={t.name}
            className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:shadow-slate-200/60"
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
              &ldquo;{t.quote}&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {t.name[0]}
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <p className="text-xs text-slate-500">{t.role}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
