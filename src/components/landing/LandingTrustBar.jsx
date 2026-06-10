import { Clock, CreditCard, Headphones, ShieldCheck } from "lucide-react";

const DEFAULT_ITEMS = [
  { icon: CreditCard, label: "No credit card required" },
  { icon: Clock, label: "Live in ~15 minutes" },
  { icon: ShieldCheck, label: "99.9% uptime SLA" },
  { icon: Headphones, label: "Email support included" },
];

export default function LandingTrustBar({ items = DEFAULT_ITEMS }) {
  if (!items?.length) return null;

  return (
    <section aria-label="Trust highlights" className="border-y border-slate-200/80 bg-white py-4 sm:py-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {items.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 sm:px-4"
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 break-words text-[11px] font-semibold leading-snug text-slate-700 sm:text-xs">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
