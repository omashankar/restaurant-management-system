import { peakHours } from "@/lib/mockData";
import { INITIAL_FLOOR_TABLES, INITIAL_INVENTORY_ITEMS } from "@/lib/modulesData";
import { Activity, Package, Table2, Trophy } from "lucide-react";

const activeTables = INITIAL_FLOOR_TABLES.filter((t) => t.status === "occupied").length;
const totalTables = INITIAL_FLOOR_TABLES.length;

const lowStockItems = INITIAL_INVENTORY_ITEMS.filter(
  (i) => i.quantity === 0 || i.quantity < i.reorderLevel
);

const peakSlot = peakHours.reduce((a, b) => (a.load > b.load ? a : b));

export default function SmartMetrics() {
  const maxLoad = Math.max(...peakHours.map((h) => h.load));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {/* Peak Hours */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/20">
            <Activity className="size-4" aria-hidden />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Peak Hours</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">8 PM – 10 PM</p>
        <div className="mt-3 flex h-10 items-end gap-0.5">
          {peakHours.map((h) => (
            <div
              key={h.hour}
              className="flex flex-1 flex-col items-center"
              title={`${h.hour}: ${h.load}%`}
            >
              <div
                className={`w-full rounded-sm transition-all ${
                  h.load === maxLoad
                    ? "bg-indigo-400"
                    : h.load >= 70
                    ? "bg-indigo-500/60"
                    : "bg-zinc-700"
                }`}
                style={{ height: `${Math.max((h.load / maxLoad) * 100, 10)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Peak at <span className="text-indigo-400">{peakSlot.hour}</span> · {peakSlot.load}% capacity
        </p>
      </div>

      {/* Best Category */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20">
            <Trophy className="size-4" aria-hidden />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Best Category</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">Fast Food</p>
        <div className="mt-3 space-y-1.5">
          {[
            { name: "Fast Food", pct: 100, orders: 96 },
            { name: "Beverages", pct: 58, orders: 56 },
            { name: "Desserts", pct: 44, orders: 42 },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-amber-400/80 transition-all duration-500"
                  style={{ width: `${c.pct}%` }}
                />
              </div>
              <span className="w-16 text-right text-xs tabular-nums text-zinc-500">
                {c.orders} orders
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">96 orders today</p>
      </div>

      {/* Low Stock Alert */}
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
            <Package className="size-4" aria-hidden />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500/80">Low Stock</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">
          {lowStockItems.length} items
        </p>
        <div className="mt-3 space-y-1.5">
          {lowStockItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-zinc-400">{item.name}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${
                  item.quantity === 0
                    ? "bg-red-500/15 text-red-400 ring-red-500/25"
                    : "bg-amber-500/15 text-amber-300 ring-amber-500/25"
                }`}
              >
                {item.quantity === 0 ? "Out" : `${item.quantity} ${item.unit}`}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-amber-500/70">Reorder needed</p>
      </div>

      {/* Active Tables */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20">
            <Table2 className="size-4" aria-hidden />
          </span>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Active Tables</p>
        </div>
        <p className="mt-3 text-lg font-semibold text-zinc-50">
          {activeTables} / {totalTables}
        </p>
        <div className="mt-3 flex gap-1.5 flex-wrap">
          {INITIAL_FLOOR_TABLES.map((t) => (
            <span
              key={t.id}
              className={`rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${
                t.status === "occupied"
                  ? "bg-sky-500/15 text-sky-300 ring-sky-500/25"
                  : "bg-zinc-800 text-zinc-500 ring-zinc-700/50"
              }`}
            >
              {t.tableNumber}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {totalTables - activeTables} available now
        </p>
      </div>
    </div>
  );
}
