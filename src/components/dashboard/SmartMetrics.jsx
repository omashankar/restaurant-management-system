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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20">
            <Activity className="size-4" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Peak Hours</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">{peakHour}</p>
        <p className="mt-2 text-xs text-zinc-500">Based on order history</p>
      </div>

      {/* Best Category */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20">
            <Trophy className="size-4" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Best Category</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">{bestCategory}</p>
        <p className="mt-2 text-xs text-zinc-500">Top performing category</p>
      </div>

      {/* Low Stock */}
      <div className={`rounded-2xl border p-4 ${lowStockCount > 0 ? "border-amber-500/25 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/60"}`}>
        <div className="flex items-center gap-2">
          <span className={`flex size-8 items-center justify-center rounded-lg ring-1 ${lowStockCount > 0 ? "bg-amber-500/15 text-amber-400 ring-amber-500/25" : "bg-zinc-800 text-zinc-500 ring-zinc-700"}`}>
            <Package className="size-4" />
          </span>
          <p className={`text-xs font-semibold uppercase tracking-wide ${lowStockCount > 0 ? "text-amber-500/80" : "text-zinc-500"}`}>Low Stock</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">{lowStockCount} items</p>
        {lowStockItems.length > 0 ? (
          <div className="mt-3 space-y-1.5">
            {lowStockItems.slice(0, 3).map((item, i) => (
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
          <p className="mt-2 text-xs text-zinc-600">All items in stock.</p>
        )}
      </div>

      {/* Active Tables */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
            <Table2 className="size-4" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Active Tables</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">{activeTables} / {totalTables}</p>
        {tableList.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tableList.slice(0, 12).map((t) => (
              <span key={t.id ?? t.tableNumber}
                className={`rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${
                  t.status === "occupied" ? "bg-sky-500/15 text-sky-300 ring-sky-500/25" : "bg-zinc-800 text-zinc-500 ring-zinc-700/50"
                }`}>
                {t.tableNumber}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-zinc-600">No tables configured.</p>
        )}
        <p className="mt-2 text-xs text-zinc-500">{totalTables - activeTables} available now</p>
      </div>
    </div>
  );
}
