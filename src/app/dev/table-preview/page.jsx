"use client";

import TableGridExample from "@/components/table/TableGridExample";
import TableCapacityIcon from "@/components/table/TableCapacityIcon";

const LEGEND = [
  { cap: 2, label: "1-2 persons" },
  { cap: 4, label: "3-4 persons" },
  { cap: 6, label: "5-6 persons" },
  { cap: 8, label: "7-8 persons" },
  { cap: 10, label: "More than 8" },
];

export default function TablePreviewPage() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Developer Preview</p>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">Dynamic Table UI Preview</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Capacity-based table icons, status colors, hover behavior, and reusable card layout.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700">Capacity Icon Mapping</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LEGEND.map((item) => (
              <div key={item.cap} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-center">
                <div className="mx-auto w-fit rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-700">
                  <TableCapacityIcon capacity={item.cap} className="size-10" />
                </div>
                <p className="mt-2 text-xs font-medium text-zinc-700">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-700">Interactive Table Cards</h2>
          <p className="mt-1 text-xs text-zinc-500">Green = Available, Red = Occupied, Yellow = Reserved</p>
          <div className="mt-4">
            <TableGridExample />
          </div>
        </section>
      </div>
    </main>
  );
}
