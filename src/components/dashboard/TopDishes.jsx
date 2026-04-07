import { topDishes } from "@/lib/mockData";
import { Flame } from "lucide-react";

const rankColors = [
  "text-amber-400",
  "text-zinc-300",
  "text-orange-400",
  "text-zinc-500",
  "text-zinc-500",
];

export default function TopDishes() {
  const maxOrders = topDishes[0]?.orders ?? 1;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <Flame className="size-4 text-orange-400" aria-hidden />
        <h3 className="text-sm font-semibold text-zinc-100">Top Dishes Today</h3>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">By order count · live mock</p>

      <div className="mt-4 space-y-3">
        {topDishes.map((dish, i) => {
          const barW = Math.round((dish.orders / maxOrders) * 100);
          return (
            <div key={dish.rank} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`w-5 shrink-0 text-xs font-bold tabular-nums ${rankColors[i]}`}>
                    #{dish.rank}
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-200">{dish.name}</span>
                  <span className="hidden shrink-0 rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500 sm:inline">
                    {dish.category}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                  <span className="text-zinc-400">{dish.orders} orders</span>
                  <span className="font-semibold text-emerald-400">${dish.revenue.toFixed(0)}</span>
                </div>
              </div>
              {/* progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${barW}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
