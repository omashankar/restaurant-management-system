import { adminSurface } from "@/config/adminSurfaceClasses";
import { Activity, Package, Table2, Trophy } from "lucide-react";

export default function SmartMetrics({
  peakHour    = "—",
  bestCategory = "—",
  lowStockCount = 0,
  lowStockItems = [],
  activeTables  = 0,
  totalTables   = 0,
  tableList     = [],
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Peak Hours */}
      <div className="admin-surface-card p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20">
            <Activity className="size-4" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>Peak Hours</p>
        </div>
        <p className="mt-3 admin-surface-title text-lg font-semibold">{peakHour}</p>
        <p className="mt-2 admin-surface-subheading">Based on order history</p>
      </div>

      {/* Best Category */}
      <div className="admin-surface-card p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20">
            <Trophy className="size-4" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>Best Category</p>
        </div>
        <p className="mt-3 admin-surface-title text-lg font-semibold">{bestCategory}</p>
        <p className="mt-2 admin-surface-subheading">Top performing category</p>
      </div>

      {/* Low Stock */}
      <div className={`p-4 ${lowStockCount > 0 ? "rounded-2xl border border-amber-500/25 bg-amber-500/5" : adminSurface.card}`}>
        <div className="flex items-center gap-2">
          <span className={`flex size-8 items-center justify-center rounded-lg ring-1 ${lowStockCount > 0 ? "bg-amber-500/15 text-amber-400 ring-amber-500/25" : "bg-zinc-800 text-zinc-500 ring-zinc-700"}`}>
            <Package className="size-4" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${lowStockCount > 0 ? "text-amber-500/80" : adminSurface.muted}`}>Low Stock</p>
        </div>
        <p className="mt-3 admin-surface-title text-lg font-semibold">{lowStockCount} items</p>
        {lowStockItems.length > 0 ? (
          <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-3 max-h-28 space-y-1.5 pr-1">
            {lowStockItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="truncate text-xs text-zinc-400">{item.name}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                  item.quantity === 0 ? "bg-red-500/15 text-red-400 ring-red-500/25" : "bg-amber-500/15 text-amber-300 ring-amber-500/25"
                }`}>
                  {item.quantity === 0 ? "Out" : `${item.quantity} ${item.unit ?? ""}`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs admin-surface-faint">All items in stock.</p>
        )}
      </div>

      {/* Active Tables */}
      <div className="admin-surface-card p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-20">
            <Table2 className="size-4" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${adminSurface.muted}`}>Active Tables</p>
        </div>
        <p className="mt-3 admin-surface-title text-lg font-semibold">{activeTables} / {totalTables}</p>
        {tableList.length > 0 ? (
          <div className="rms-dashboard-card__body rms-dashboard-card__body--y mt-3 max-h-32 pr-1">
            <div className="flex flex-wrap gap-1.5">
            {tableList.map((t) => (
              <span key={t.id ?? t.tableNumber}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${
                  t.status === "occupied" ? "bg-sky-500/15 text-sky-300 ring-sky-500/25" : "bg-zinc-800 text-zinc-500 ring-zinc-700/50"
                }`}>
                {t.tableNumber}
              </span>
            ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs admin-surface-faint">No tables configured.</p>
        )}
        <p className="mt-2 shrink-0 admin-surface-subheading">{totalTables - activeTables} available now</p>
      </div>
    </div>
  );
}
