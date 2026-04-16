import { Flame } from "lucide-react";

const rankColors = ["text-amber-400", "text-zinc-300", "text-orange-400", "text-zinc-500", "text-zinc-500"];

export default function TopDishes({ items = [] }) {
  const maxOrders = items[0]?.orders ?? items[0]?.qty ?? 1;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-orange-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Top Dishes Today</h3>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-600">No order data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center gap-2">
        <Flame className="size-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-zinc-100">Top Dishes Today</h3>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">By order count</p>
      <div className="mt-4 space-y-3">
        {items.slice(0, 5).map((dish, i) => {
          const count = dish.orders ?? dish.qty ?? 0;
          const barW  = Math.round((count / maxOrders) * 100);
          return (
            <div key={dish.name ?? i} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`w-5 shrink-0 text-xs font-bold tabular-nums ${rankColors[i]}`}>
                    #{i + 1}
                  </span>
                  <span className="truncate text-sm font-medium text-zinc-200">{dish.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs tabular-nums">
                  <span className="text-zinc-400">{count} orders</span>
                  {dish.revenue != null && (
                    <span className="font-semibold text-emerald-400">${Number(dish.revenue).toFixed(0)}</span>
                  )}
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                  style={{ width: `${barW}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
