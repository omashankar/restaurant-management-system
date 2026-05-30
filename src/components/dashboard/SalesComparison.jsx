import { formatAdminMoney } from "@/lib/adminCurrency";
import { TrendingUp } from "lucide-react";

export default function SalesComparison({
  currency = "INR",
  current = 0,
  previous = 0,
  monthly = [],
}) {
  const change = previous > 0 ? (((current - previous) / previous) * 100).toFixed(1) : 0;
  const max    = Math.max(...monthly.map((m) => m.sales ?? 0), 1);

  return (
    <div className="rms-dashboard-card rms-dashboard-card--md flex h-full min-h-0 w-full flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Revenue Breakdown</h3>
          <p className="text-xs text-zinc-500">Current vs previous period</p>
        </div>
        {Number(change) !== 0 && (
          <div className="flex items-center gap-1.5 rounded-xl border border-ra-primary-25 bg-ra-primary-10 px-3 py-1.5">
            <TrendingUp className="size-3.5 text-ra-primary" />
            <span className="text-xs font-semibold text-ra-primary">
              {change > 0 ? "+" : ""}{change}% vs last period
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs text-zinc-500">This Period</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-50">
            {formatAdminMoney(current, currency)}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full w-full rounded-full bg-ra-primary-100" />
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
          <p className="text-xs text-zinc-500">Last Period</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-400">
            {formatAdminMoney(previous, currency)}
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div className="h-full rounded-full bg-zinc-600"
              style={{ width: current > 0 ? `${Math.round((previous / current) * 100)}%` : "0%" }} />
          </div>
        </div>
      </div>

      <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-4 min-h-0 flex-1 pr-1">
      {monthly.length > 0 ? (
        <div className="flex min-h-28 items-end gap-1.5">
          {monthly.map((m, i) => {
            const isLast = i === monthly.length - 1;
            const h = Math.round(((m.sales ?? 0) / max) * 100);
            return (
              <div key={m.month ?? i} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-20 w-full items-end justify-center">
                  <div className={`w-full max-w-10 rounded-t-md transition-all duration-500 ${
                    isLast ? "bg-gradient-to-t from-ra-accent to-ra-primary" : "bg-zinc-700 hover:bg-zinc-600"
                  }`} style={{ height: `${Math.max(h, 6)}%` }} />
                </div>
                <span className="text-[10px] font-medium text-zinc-500">{m.month}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-zinc-600">No monthly data yet.</p>
      )}
      </div>
    </div>
  );
}
