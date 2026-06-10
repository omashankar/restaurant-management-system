import { getIcon } from "@/lib/iconMap";
import SectionTitle from "./SectionTitle";

export default function HowItWorksSection({ data = {} }) {
  const {
    eyebrow = "How It Works",
    title = "From setup to service in minutes",
    subtext = "Follow the same flow your team uses every day.",
    steps = [],
  } = data;

  if (!steps.length) return null;

  return (
    <section id="how-it-works" className="scroll-mt-16 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={eyebrow} title={title} subtext={subtext} />

        <ol className="relative mt-12 space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-5 lg:gap-3">
          {/* Desktop connector line */}
          <div
            className="pointer-events-none absolute left-[10%] right-[10%] top-5 hidden h-0.5 bg-gradient-to-r from-indigo-200 via-indigo-300 to-indigo-200 lg:block"
            aria-hidden
          />

          {steps.map(({ n, title: stepTitle, text, icon }, i) => {
            const Icon = getIcon(icon);
            const isLast = i === steps.length - 1;

            return (
              <li key={n} className="relative list-none pl-8 lg:pl-0">
                {/* Mobile / tablet timeline */}
                {!isLast && (
                  <span
                    className="absolute left-[11px] top-10 h-[calc(100%+0.25rem)] w-px bg-indigo-200 lg:hidden"
                    aria-hidden
                  />
                )}
                <span
                  className="absolute left-0 top-1 inline-flex size-6 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-[10px] font-bold text-white shadow-sm lg:hidden"
                  aria-hidden
                >
                  {i + 1}
                </span>

                <article className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                  <span className="relative z-10 mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25 transition-transform group-hover:scale-105">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <p className="text-[10px] font-bold tracking-[0.25em] text-indigo-500">{n}</p>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">{stepTitle}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{text}</p>
                </article>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
