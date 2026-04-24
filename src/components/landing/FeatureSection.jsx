import SectionTitle from "./SectionTitle";
import { FEATURES } from "./data";

export default function FeatureSection() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Core Features"
          title="Everything needed to run a modern restaurant"
          subtext="Purpose-built modules for front-of-house, kitchen, and management teams."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ title, desc, Icon }) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-300 hover:bg-white hover:shadow-lg hover:shadow-indigo-100/50"
            >
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition-colors duration-200 group-hover:bg-indigo-600 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
