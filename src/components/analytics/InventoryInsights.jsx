import { AlertTriangle, Package } from "lucide-react";
import Link from "next/link";

export default function InventoryInsights({ lowStock = [], mostUsed = [] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Low stock */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-zinc-100">Low Stock Alerts</h3>
          </div>
          <Link href="/inventory" className="cursor-pointer text-xs font-medium text-amber-400 hover:text-amber-300">Manage →</Link>
        </div>
        {lowStock.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">All items in stock.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {lowStock.map((item) => (
              <div key={item.id ?? item.name}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-3 py-2.5">
                <span className="text-sm text-zinc-300">{item.name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                  item.quantity === 0 ? "bg-red-500/15 text-red-400 ring-red-500/25" : "bg-amber-500/15 text-amber-300 ring-amber-500/25"
                }`}>
                  {item.quantity === 0 ? "Out of stock" : `${item.quantity} ${item.unit ?? ""}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Most used */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100">Most Used Ingredients</h3>
        </div>
        {mostUsed.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-600">No usage data yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {mostUsed.map((item, i) => {
              const pct = Math.round(((mostUsed.length - i) / mostUsed.length) * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-zinc-300">{item.name}</span>
                    <span className="text-xs tabular-nums text-zinc-500">{item.usage} {item.unit}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div className="h-full rounded-full bg-emerald-500/60 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
