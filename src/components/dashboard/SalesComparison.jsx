import { TrendingUp } from "lucide-react";

function fmt(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n}`;
}

export default function SalesComparison({ current = 0, previous = 0, monthly = [] }) {
  const change = previous > 0 ? (((current - previous) / previous) * 100).toFixed(1) : 0;
  const max    = Math.max(...monthly.map((m) => m.sales ?? 0), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Revenue Breakdown</h3>
          <p className="text-xs text-zinc-500">Current vs previous period</p>
        </div>
        {Number(change) !== 0 && (
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5">
            <TrendingUp className="size-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">
              {change > 0 ? "+" : ""}{change}% vs last period
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs text-zinc-500">This Period</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-50">{fmt(current)}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-full rounded-full bg-emerald-500/80" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs text-zinc-500">Last Period</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-400">{fmt(previous)}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-zinc-600"
              style={{ width: current > 0 ? `${Math.round((previous / current) * 100)}%` : "0%" }} />
          </div>
        </div>
      </div>

      {monthly.length > 0 ? (
        <div className="mt-5 flex h-28 items-end gap-1.5">
          {monthly.map((m, i) => {
            const isLast = i === monthly.length - 1;
            const h = Math.round(((m.sales ?? 0) / max) * 100);
            return (
              <div key={m.month ?? i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end justify-center">
                  <div className={`w-full max-w-10 rounded-t-md transition-all duration-500 ${
                    isLast ? "bg-gradient-to-t from-emerald-600 to-emerald-400" : "bg-zinc-700 hover:bg-zinc-600"
                  }`} style={{ height: `${Math.max(h, 6)}%` }} />
                </div>
                <span className="text-[10px] font-medium text-zinc-500">{m.month}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-zinc-600">No monthly data yet.</p>
      )}
    </div>
  );
}
