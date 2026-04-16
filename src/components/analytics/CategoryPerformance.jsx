function fmt(n) { return `$${(n / 1000).toFixed(1)}k`; }

export default function CategoryPerformance({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Category Performance</h3>
        <p className="mt-6 text-center text-sm text-zinc-600">No data yet.</p>
      </div>
    );
  }

  const max   = Math.max(...data.map((c) => c.revenue ?? 0), 1);
  const total = data.reduce((s, c) => s + (c.revenue ?? 0), 0);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Category Performance</h3>
      <p className="text-xs text-zinc-500">Revenue by category</p>
      <div className="mt-5 space-y-4">
        {data.map((c, i) => {
          const pct   = Math.round(((c.revenue ?? 0) / max) * 100);
          const share = total > 0 ? (((c.revenue ?? 0) / total) * 100).toFixed(0) : 0;
          const color = c.color ?? "#10b981";
          return (
            <div key={c.name ?? i} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-zinc-200">{c.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs tabular-nums">
                  {c.orders != null && <span className="text-zinc-500">{c.orders} orders</span>}
                  <span className="font-semibold text-zinc-100">{fmt(c.revenue ?? 0)}</span>
                  <span className="w-8 text-right text-zinc-600">{share}%</span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
