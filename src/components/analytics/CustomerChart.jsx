import { Users } from "lucide-react";

export default function CustomerChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <h3 className="text-sm font-semibold text-zinc-100">Customer Analytics</h3>
        <p className="mt-6 text-center text-sm text-zinc-600">No data yet.</p>
      </div>
    );
  }

  const maxAll = Math.max(...data.flatMap((c) => [c.newCustomers ?? 0, c.returning ?? 0]), 1);
  const last   = data.at(-1);
  const prev   = data.at(-2);
  const change = prev?.newCustomers > 0
    ? (((last.newCustomers - prev.newCustomers) / prev.newCustomers) * 100).toFixed(1)
    : 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Customer Analytics</h3>
          <p className="text-xs text-zinc-500">New vs returning</p>
        </div>
        {Number(change) !== 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            <Users className="size-3" /> {change > 0 ? "+" : ""}{change}% new
          </span>
        )}
      </div>
      <div className="mt-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-xs text-zinc-400"><span className="size-2.5 rounded-full bg-sky-400" /> New</span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="size-2.5 rounded-full bg-emerald-500/70" /> Returning</span>
      </div>
      <div className="mt-4 flex h-44 items-end gap-2">
        {data.map((c, i) => {
          const hN = Math.round(((c.newCustomers ?? 0) / maxAll) * 100);
          const hR = Math.round(((c.returning ?? 0) / maxAll) * 100);
          return (
            <div key={c.month ?? i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-36 w-full items-end justify-center gap-0.5">
                <div className="w-full max-w-[16px] rounded-t-md bg-sky-500/70 hover:bg-sky-400 transition-all duration-500"
                  style={{ height: `${Math.max(hN, 4)}%` }} />
                <div className="w-full max-w-[16px] rounded-t-md bg-emerald-500/50 hover:bg-emerald-400/70 transition-all duration-500"
                  style={{ height: `${Math.max(hR, 4)}%` }} />
              </div>
              <span className="text-[10px] font-medium text-zinc-500">{c.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
