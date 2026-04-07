import { categoryRevenue } from "@/lib/mockData";

function fmt(n) {
  return `$${(n / 1000).toFixed(1)}k`;
}

export default function CategoryPerformance() {
  const max = Math.max(...categoryRevenue.map((c) => c.revenue), 1);
  const total = categoryRevenue.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Category Performance</h3>
      <p className="text-xs text-zinc-500">Revenue by category this month</p>

      <div className="mt-5 space-y-4">
        {categoryRevenue.map((c) => {
          const pct = Math.round((c.revenue / max) * 100);
          const share = ((c.revenue / total) * 100).toFixed(0);
          return (
            <div key={c.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-sm font-medium text-zinc-200">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  <span className="text-zinc-500">{c.orders} orders</span>
                  <span className="font-semibold text-zinc-100">{fmt(c.revenue)}</span>
                  <span className="w-8 text-right text-zinc-600">{share}%</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: c.color, opacity: 0.85 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
