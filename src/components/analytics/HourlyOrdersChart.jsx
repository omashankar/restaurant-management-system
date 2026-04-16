import { Clock } from "lucide-react";

export default function HourlyOrdersChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Peak Order Times</h3>
        <p className="mt-6 text-center text-sm text-zinc-600">No data yet.</p>
      </div>
    );
  }

  const max  = Math.max(...data.map((h) => h.orders), 1);
  const peak = data.reduce((a, b) => (a.orders > b.orders ? a : b));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Peak Order Times</h3>
          <p className="text-xs text-zinc-500">Hourly order volume</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Clock className="size-3" /> Peak: {peak.hour}
        </span>
      </div>
      <div className="mt-5 flex h-40 items-end gap-1">
        {data.map((h) => {
          const pct    = Math.round((h.orders / max) * 100);
          const isPeak = h.hour === peak.hour;
          return (
            <div key={h.hour} className="group flex flex-1 flex-col items-center gap-1">
              <div className="flex h-32 w-full items-end justify-center">
                <div className={`w-full rounded-t-md transition-all duration-500 ${
                  isPeak ? "bg-gradient-to-t from-indigo-600 to-indigo-400" : "bg-zinc-700 group-hover:bg-zinc-600"
                }`} style={{ height: `${Math.max(pct, 4)}%` }} title={`${h.hour}: ${h.orders}`} />
              </div>
              <span className={`text-[9px] font-medium ${isPeak ? "text-indigo-400" : "text-zinc-600"}`}>{h.hour}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
