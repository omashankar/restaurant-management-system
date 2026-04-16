import { CalendarDays } from "lucide-react";

export default function BestDayChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Best Day of Week</h3>
        <p className="mt-6 text-center text-sm text-zinc-600">No data yet.</p>
      </div>
    );
  }

  const best = data.reduce((a, b) => (a.score > b.score ? a : b));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Best Day of Week</h3>
          <p className="text-xs text-zinc-500">Indexed revenue score</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
          <CalendarDays className="size-3" /> {best.day}
        </span>
      </div>
      <div className="mt-5 flex h-36 items-end gap-2">
        {data.map((d) => {
          const isBest = d.day === best.day;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-28 w-full items-end justify-center">
                <div className={`w-full max-w-10 rounded-t-lg transition-all duration-500 ${
                  isBest ? "bg-gradient-to-t from-amber-600 to-amber-400" : "bg-zinc-700 hover:bg-zinc-600"
                }`} style={{ height: `${Math.max(d.score, 6)}%` }} />
              </div>
              <span className={`text-[10px] font-semibold ${isBest ? "text-amber-400" : "text-zinc-500"}`}>{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
