import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import SectionTitle from "./SectionTitle";

export default function ProblemSolutionSection({ data = {} }) {
  const {
    sectionEyebrow = "Why RMS",
    sectionTitle = "From chaos to control in one platform",
    sectionSubtext = "See what breaks without a system — and how RMS fixes it for busy teams.",
    problemEyebrow = "The Problem",
    problemTitle = "Running a restaurant is hard",
    problems = [],
    solutionEyebrow = "The Solution",
    solutionTitle = "RMS handles it all",
    solutionDescription = "",
    solutionPoints = [],
  } = data;

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={sectionEyebrow} title={sectionTitle} subtext={sectionSubtext} />

        <div className="relative mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <article className="relative rounded-2xl border border-rose-200/90 bg-gradient-to-br from-rose-50 via-white to-white p-4 shadow-sm sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
              <AlertTriangle className="size-3.5" aria-hidden />
              {problemEyebrow}
            </div>
            <h3 className="mt-4 break-words text-xl font-bold text-slate-900 sm:text-2xl">
              {problemTitle}
            </h3>
            <ul className="mt-6 space-y-3">
              {problems.map((p, i) => (
                <li key={p} className="flex items-start gap-3 rounded-xl bg-white/70 px-3 py-2.5 text-sm text-slate-700 ring-1 ring-rose-100">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">
                    {i + 1}
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </article>

          <div className="flex justify-center py-1 lg:pointer-events-none lg:absolute lg:left-1/2 lg:top-1/2 lg:z-10 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:py-0">
            <span className="inline-flex size-10 rotate-90 items-center justify-center rounded-full border-4 border-white bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 lg:size-11 lg:rotate-0">
              <ArrowRight className="size-5" aria-hidden />
            </span>
          </div>

          <article className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-white p-4 shadow-sm sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="size-3.5" aria-hidden />
              {solutionEyebrow}
            </div>
            <h3 className="mt-4 break-words text-xl font-bold text-slate-900 sm:text-2xl">
              {solutionTitle}
            </h3>
            {solutionDescription && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{solutionDescription}</p>
            )}
            <ul className="mt-6 grid gap-2 sm:grid-cols-1">
              {solutionPoints.map((label) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-emerald-100"
                >
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
  );
}
