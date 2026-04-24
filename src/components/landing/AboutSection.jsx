import { CheckCircle2 } from "lucide-react";
import SectionTitle from "./SectionTitle";

/**
 * AboutSection — accepts `about` prop from CMS or uses defaults.
 *
 * Props:
 *   about: {
 *     headline:    string
 *     description: string
 *     imageUrl:    string   (optional)
 *     stats:       [{ value, label }]
 *     values:      [{ icon, title, description }]
 *   }
 */
export default function AboutSection({ about = {} }) {
  const {
    headline    = "Built by people who understand restaurants",
    description = "Restaurant OS was built to solve the real operational chaos that restaurant owners face every day — from missed orders to inventory surprises. We built one platform that handles it all.",
    imageUrl    = "",
    stats       = [
      { value: "500+",   label: "Restaurants onboarded" },
      { value: "15 min", label: "Average setup time"    },
      { value: "99.9%",  label: "Uptime SLA"            },
      { value: "60%",    label: "Billing time saved"    },
    ],
    values = [
      { title: "Speed",       description: "Every feature is optimised for busy service hours."       },
      { title: "Reliability", description: "99.9% uptime so your team is never blocked."             },
      { title: "Team-first",  description: "Role-based access keeps every team member focused."      },
    ],
  } = about;

  return (
    <section id="about" className="scroll-mt-16 bg-white py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Two-column layout */}
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">

          {/* Left — copy */}
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">About Us</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {headline}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
            </div>

            {/* Values list */}
            {values.length > 0 && (
              <ul className="space-y-4">
                {values.map((v) => (
                  <li key={v.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <CheckCircle2 className="size-3.5 text-indigo-600" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{v.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{v.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right — stats grid or image */}
          <div>
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="About Restaurant OS"
                className="w-full rounded-3xl border border-slate-200 object-cover shadow-xl"
              />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {stats.map((s) => (
                  <div key={s.label}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
                    <p className="text-3xl font-extrabold tabular-nums text-indigo-600">{s.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{s.label}</p>
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
