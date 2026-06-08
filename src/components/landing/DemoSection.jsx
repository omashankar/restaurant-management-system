import { BarChart3, PackageSearch, TrendingUp } from "lucide-react";
import SectionTitle from "./SectionTitle";

export default function DemoSection({ demo = {} }) {
  const {
    sectionId = "demo",
    eyebrow = "Dashboard Preview",
    title = "A control center for operations and growth",
    subtext = "Monitor performance, track orders, and catch inventory risks before they become issues.",
  } = demo;

  return (
    <section id={sectionId} className="scroll-mt-16 bg-white py-16 sm:py-20">
      <div className="mx-auto w-full min-w-0 max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionTitle eyebrow={eyebrow} title={title} subtext={subtext} />

        <div className="mt-12 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Operations Dashboard</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live sync
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Sales Overview</p>
                <BarChart3 className="size-4 text-indigo-400" />
              </div>
              <div className="mt-4 flex h-32 items-end gap-1.5">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md bg-indigo-100 transition-colors hover:bg-indigo-500"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-emerald-600">
                <TrendingUp className="size-3" /> +12% vs last week
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Live Orders</p>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  3 active
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {[
                  { id: "#1043", label: "Table 6 · Pasta", status: "Ready", c: "bg-emerald-100 text-emerald-700" },
                  { id: "#1044", label: "Delivery · Burger", status: "In Prep", c: "bg-amber-100 text-amber-700" },
                  { id: "#1045", label: "Takeaway · Latte", status: "Packed", c: "bg-indigo-100 text-indigo-700" },
                ].map((o) => (
                  <li key={o.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-400">{o.id}</span>
                      <p className="truncate text-slate-700">{o.label}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${o.c}`}>
                      {o.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Inventory Alerts</p>
                <PackageSearch className="size-4 text-amber-400" />
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-rose-700">
                  <span className="size-2 rounded-full bg-rose-500" /> Tomatoes: out of stock
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-amber-700">
                  <span className="size-2 rounded-full bg-amber-500" /> Olive Oil: low stock
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-700">
                  <span className="size-2 rounded-full bg-emerald-500" /> Coffee Beans: OK
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <p className="font-semibold text-slate-500">Stock Health</p>
                  <p className="font-semibold text-indigo-600">68%</p>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                  <div className="h-2 w-[68%] rounded-full bg-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
