import { getIcon } from "@/lib/iconMap";
import SectionTitle from "./SectionTitle";

export default function AboutSection({ about = {} }) {
  const {
    headline = "Built by people who understand restaurants",
    description = "BhojDesk was built to solve the real operational chaos that restaurant owners face every day — from missed orders to inventory surprises. We built one platform that handles it all.",
    imageUrl = "",
    stats = [
      { value: "500+", label: "Restaurants onboarded" },
      { value: "15 min", label: "Average setup time" },
      { value: "99.9%", label: "Uptime SLA" },
      { value: "60%", label: "Billing time saved" },
    ],
    values = [],
  } = about;

  return (
    <section id="about" className="scroll-mt-16 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="min-w-0 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">About Us</p>
              <h2 className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
                {headline}
              </h2>
              <p className="mt-4 break-words text-base leading-relaxed text-slate-600">{description}</p>
            </div>

            {values.length > 0 && (
              <ul className="space-y-3">
                {values.map((v) => {
                  const Icon = getIcon(v.icon);
                  return (
                    <li
                      key={v.title}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{v.title}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{v.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="About BhojDesk"
                className="w-full rounded-3xl border border-slate-200 object-cover shadow-xl"
              />
            ) : (
              <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
                {stats.map((s, i) => (
                  <div
                    key={s.label}
                    className={`min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 ${
                      i === 0 ? "col-span-2 sm:col-span-1" : ""
                    }`}
                  >
                    <p className="break-words text-2xl font-extrabold tabular-nums text-indigo-600 sm:text-3xl">
                      {s.value}
                    </p>
                    <p className="mt-2 break-words text-xs text-slate-500 sm:text-sm">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
