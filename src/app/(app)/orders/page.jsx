"use client";

import { useModuleData } from "@/context/ModuleDataContext";
import { recentOrdersTable } from "@/lib/mockData";
import {
  Bike,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ConciergeBell,
  Search,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { useMemo, useState } from "react";

/* ── Status config ── */
const STATUS = {
  new:       { label: "New",       badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25" },
  preparing: { label: "Preparing", badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25" },
  ready:     { label: "Ready",     badge: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25" },
  completed: { label: "Completed", badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25" },
  cancelled: { label: "Cancelled", badge: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25" },
};

/* ── Order type config ── */
const TYPE_ICON = {
  "dine-in":  { Icon: Store,         color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "takeaway": { Icon: ConciergeBell, color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  "delivery": { Icon: Bike,          color: "text-sky-400",     bg: "bg-sky-500/10"     },
};

/* ── Seed mock orders (shown when no real orders exist) ── */
const MOCK_ORDERS = [
  ...recentOrdersTable,
  { id: "ORD-1035", customer: "Raj P.",    type: "dine-in",  table: "T06", amount: 156.0,  status: "completed", time: "52 min ago" },
  { id: "ORD-1034", customer: "Nina D.",   type: "delivery", table: "—",   amount: 89.5,   status: "completed", time: "1 hr ago"   },
  { id: "ORD-1033", customer: "Chen W.",   type: "dine-in",  table: "T01", amount: 210.25, status: "completed", time: "1 hr ago"   },
  { id: "ORD-1032", customer: "Walk-in",   type: "takeaway", table: "—",   amount: 45.0,   status: "completed", time: "1.5 hr ago" },
];

const FILTERS = ["all", "new", "preparing", "ready", "completed", "cancelled"];

/* ── Summary counts ── */
function useSummary(orders) {
  return useMemo(() => {
    const counts = { new: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [orders]);
}

/* ── Single order card ── */
function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false);
  const st = STATUS[order.status] ?? STATUS.completed;
  const tp = TYPE_ICON[order.type] ?? TYPE_ICON["dine-in"];
  const { Icon: TypeIcon } = tp;

  return (
    <div className={`rounded-2xl border bg-zinc-900/70 shadow-sm transition-all duration-200 hover:shadow-md ${
      order.status === "new" ? "border-amber-500/30" :
      order.status === "preparing" ? "border-sky-500/20" :
      order.status === "ready" ? "border-emerald-500/30" :
      "border-zinc-800"
    }`}>
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tp.bg}`}>
              <TypeIcon className={`size-4 ${tp.color}`} />
            </span>
            <div>
              <p className="font-mono text-sm font-semibold text-emerald-400">{order.id}</p>
              <p className="text-xs text-zinc-500">
                {order.table !== "—" ? `Table ${order.table}` : order.type === "delivery" ? "Delivery" : "Takeaway"}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${st.badge}`}>
            {st.label}
          </span>
        </div>

        {/* Middle */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-zinc-400">{order.customer}</p>
          <p className="text-base font-bold text-zinc-100">${order.amount.toFixed(2)}</p>
        </div>

        {/* Bottom */}
        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
            <Clock className="size-3" /> {order.time}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            {expanded ? <><ChevronUp className="size-3" /> Less</> : <><ChevronDown className="size-3" /> Details</>}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Order type</span>
            <span className={`capitalize font-medium ${tp.color}`}>{order.type}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Table / Location</span>
            <span className="text-zinc-300">{order.table !== "—" ? `Table ${order.table}` : "—"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500">Amount</span>
            <span className="font-semibold text-zinc-100">${order.amount.toFixed(2)}</span>
          </div>
          {/* Status action */}
          {order.status === "new" && (
            <div className="pt-1">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">
                Waiting to be picked up by kitchen
              </div>
            </div>
          )}
          {order.status === "ready" && (
            <div className="pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="size-3.5" /> Ready for pickup / service
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ── */
export default function OrdersPage() {
  const { orderRows, setOrderRows } = useModuleData();
  const [filter, setFilter]   = useState("all");
  const [search, setSearch]   = useState("");
  const [sortNew, setSortNew] = useState(true);

  // Merge real orders (from context) with mock seed — real orders on top
  const ALL_ORDERS = useMemo(() => {
    if (orderRows.length > 0) return [...orderRows, ...MOCK_ORDERS];
    return MOCK_ORDERS;
  }, [orderRows]);

  const summary = useSummary(ALL_ORDERS);

  const filtered = useMemo(() => {
    let list = filter === "all" ? ALL_ORDERS : ALL_ORDERS.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.customer.toLowerCase().includes(q) ||
          (o.table ?? "").toLowerCase().includes(q)
      );
    }
    return sortNew ? list : [...list].reverse();
  }, [filter, search, sortNew, ALL_ORDERS]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <UtensilsCrossed className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Orders</h1>
            <p className="mt-1 text-sm text-zinc-500">Live ticket rail · mock dataset</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSortNew((v) => !v)}
          className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        >
          <Clock className="size-3.5" />
          {sortNew ? "Newest first" : "Oldest first"}
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { key: "new",       label: "New",       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
          { key: "preparing", label: "Preparing", color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
          { key: "ready",     label: "Ready",     color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
          { key: "completed", label: "Completed", color: "text-zinc-400",    bg: "bg-zinc-500/10",    border: "border-zinc-700"       },
          { key: "cancelled", label: "Cancelled", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
        ].map(({ key, label, color, bg, border }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(filter === key ? "all" : key)}
            className={`cursor-pointer rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${bg} ${border} ${filter === key ? "ring-1 ring-current" : ""}`}
          >
            <p className={`text-xl font-bold ${color}`}>{summary[key]}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40"
          />
        </div>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
                  : "bg-zinc-900 text-zinc-400 ring-1 ring-zinc-800 hover:text-zinc-200"
              }`}
            >
              {f === "all" ? `All (${ALL_ORDERS.length})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 py-20 text-center">
          <UtensilsCrossed className="size-10 text-zinc-700" />
          <p className="text-sm text-zinc-500">No orders match your filter.</p>
          <button type="button" onClick={() => { setFilter("all"); setSearch(""); }}
            className="cursor-pointer text-xs font-medium text-emerald-400 hover:text-emerald-300">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
