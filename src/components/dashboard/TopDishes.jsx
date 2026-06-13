import { formatAdminMoney } from "@/lib/adminCurrency";
import { Flame } from "lucide-react";

const rankColors = ["text-amber-400", "admin-surface-body", "text-orange-400", "text-zinc-500", "text-zinc-500"];

export default function TopDishes({ items = [], currency = "INR" }) {
  const maxOrders = items[0]?.orders ?? items[0]?.qty ?? 1;

  return (
    <div className="rms-dashboard-card rms-dashboard-card--lg flex h-full min-h-0 w-full min-w-0 flex-col p-4 sm:p-5 admin-surface-card">
      <div className="shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <Flame className="size-4 shrink-0 text-orange-400" aria-hidden />
          <h3 className="admin-surface-title break-words text-sm font-semibold">Top Dishes Today</h3>
        </div>
        <p className="mt-0.5 admin-surface-subheading break-words">By order count</p>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 flex flex-1 items-center justify-center px-2 text-center text-sm admin-surface-faint">
          No order data yet.
        </p>
      ) : (
        <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-3 min-h-0 flex-1 pr-1 sm:mt-4">
          <div className="space-y-3 sm:space-y-3.5">
            {items.map((dish, i) => {
              const count = dish.orders ?? dish.qty ?? 0;
              const barW = Math.round((count / maxOrders) * 100);
              return (
                <div key={dish.name ?? i} className="min-w-0 space-y-1.5">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                    <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
                      <span className={`w-5 shrink-0 pt-0.5 text-xs font-bold tabular-nums sm:pt-0 ${rankColors[i] ?? rankColors[4]}`}>
                        #{i + 1}
                      </span>
                      <span className="min-w-0 break-words text-sm font-medium leading-snug admin-shell-text">{dish.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-7 text-xs tabular-nums sm:gap-3 sm:pl-0">
                      <span className="whitespace-nowrap text-zinc-400">{count} orders</span>
                      {dish.revenue != null && (
                        <span className="whitespace-nowrap font-semibold text-ra-primary">
                          {formatAdminMoney(dish.revenue, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ra-accent to-ra-primary transition-all duration-500"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
