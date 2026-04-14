"use client";

import { useModuleData } from "@/context/ModuleDataContext";
import { kitchenTickets } from "@/lib/mockData";
import {
  CheckCircle2,
  ChefHat,
  Clock,
  Flame,
  RefreshCw,
  UtensilsCrossed,
} from "lucide-react";
import { useEffect, useState } from "react";

/* ── Extended mock tickets ── */
const INITIAL_TICKETS = [
  ...kitchenTickets,
  {
    id: "K-1042",
    table: "T12",
    orderType: "dine-in",
    customer: "Walk-in",
    placedAt: "12:02 PM",
    elapsedMin: 2,
    status: "new",
    items: [
      { name: "Classic Smash Burger", qty: 2 },
      { name: "Truffle Parmesan Fries", qty: 2 },
    ],
  },
  {
    id: "K-1038",
    table: "—",
    orderType: "delivery",
    customer: "Priya S.",
    placedAt: "11:55 AM",
    elapsedMin: 9,
    status: "preparing",
    items: [
      { name: "Crispy Chicken Wrap", qty: 1, note: "Extra spicy" },
      { name: "Iced Caramel Latte", qty: 2 },
    ],
  },
  {
    id: "K-1037",
    table: "—",
    orderType: "takeaway",
    customer: "James O.",
    placedAt: "11:50 AM",
    elapsedMin: 14,
    status: "ready",
    items: [
      { name: "Berry Lemon Cheesecake", qty: 2 },
      { name: "Craft Cola", qty: 2 },
    ],
  },
];

/* Patch existing kitchenTickets with missing fields */
const TICKETS = INITIAL_TICKETS.map((t, i) => ({
  orderType: "dine-in",
  customer: "—",
  elapsedMin: [12, 8, 15, 2, 9, 14][i] ?? 5,
  ...t,
}));

/* ── Column config ── */
const COLUMNS = [
  {
    key: "new",
    label: "New",
    accent: "text-amber-400",
    headerBg: "bg-amber-500/10 border-amber-500/20",
    borderLeft: "border-l-amber-400",
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
    dot: "bg-amber-400",
  },
  {
    key: "preparing",
    label: "Preparing",
    accent: "text-sky-400",
    headerBg: "bg-sky-500/10 border-sky-500/20",
    borderLeft: "border-l-sky-400",
    badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
    dot: "bg-sky-400",
  },
  {
    key: "ready",
    label: "Ready",
    accent: "text-emerald-400",
    headerBg: "bg-emerald-500/10 border-emerald-500/20",
    borderLeft: "border-l-emerald-400",
    badge: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
    dot: "bg-emerald-400",
  },
];

/* ── Elapsed timer ── */
function ElapsedBadge({ minutes }) {
  const urgent = minutes >= 15;
  const warn   = minutes >= 8;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      urgent ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25" :
      warn   ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25" :
               "bg-zinc-800 text-zinc-500"
    }`}>
      <Clock className="size-3" />
      {minutes}m
    </span>
  );
}

/* ── Order type label ── */
function OrderTypePill({ type }) {
  const map = {
    "dine-in":  "Dine-In",
    "takeaway": "Takeaway",
    "delivery": "Delivery",
  };
  const color = {
    "dine-in":  "text-emerald-400",
    "takeaway": "text-indigo-400",
    "delivery": "text-sky-400",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide ${color[type] ?? "text-zinc-500"}`}>
      {map[type] ?? type}
    </span>
  );
}

/* ── Ticket card ── */
function TicketCard({ ticket, col, onAction }) {
  return (
    <article className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-md shadow-black/20 border-l-4 ${col.borderLeft} transition-all duration-200 hover:border-zinc-700`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-semibold text-emerald-400">{ticket.id}</p>
            <ElapsedBadge minutes={ticket.elapsedMin} />
          </div>
          <p className="text-base font-bold text-zinc-100">
            {ticket.table !== "—" ? `Table ${ticket.table}` : ticket.customer}
          </p>
          <div className="flex items-center gap-2">
            <OrderTypePill type={ticket.orderType} />
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">{ticket.placedAt}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${col.badge}`}>
          {col.label}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5 p-4">
        {ticket.items.map((it, idx) => (
          <li key={idx} className="rounded-lg bg-zinc-950/50 px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-300">
                {it.qty}
              </span>
              <span className="font-medium text-zinc-100">{it.name}</span>
            </div>
            {it.note && (
              <p className="mt-1 pl-7 text-xs text-amber-400">{it.note}</p>
            )}
          </li>
        ))}
      </ul>

      {/* Action */}
      <div className="border-t border-zinc-800/80 p-3">
        {ticket.status === "new" && (
          <button type="button" onClick={() => onAction(ticket.id, "preparing")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/15 py-2.5 text-sm font-bold text-sky-300 ring-1 ring-sky-500/25 transition-all hover:bg-sky-500/25 active:scale-[0.98]">
            <Flame className="size-4" /> Start Cooking
          </button>
        )}
        {ticket.status === "preparing" && (
          <button type="button" onClick={() => onAction(ticket.id, "ready")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-[0.98]">
            <CheckCircle2 className="size-4" /> Mark Ready
          </button>
        )}
        {ticket.status === "ready" && (
          <button type="button" onClick={() => onAction(ticket.id, "served")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700 active:scale-[0.98]">
            <UtensilsCrossed className="size-4" /> Mark Served
          </button>
        )}
      </div>
    </article>
  );
}

/* ── Main ── */
export default function KitchenDisplay() {
  const { kitchenQueue, setKitchenQueue } = useModuleData();

  // Merge real queue (from context) with mock seed tickets
  const [tickets, setTickets] = useState(() => {
    const merged = [...TICKETS];
    return merged;
  });

  // Sync new tickets from kitchenQueue into local state
  useEffect(() => {
    if (kitchenQueue.length === 0) return;
    setTickets((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newOnes = kitchenQueue.filter((t) => !existingIds.has(t.id));
      if (newOnes.length === 0) return prev;
      return [...newOnes, ...prev];
    });
  }, [kitchenQueue]);

  /* Tick elapsed time every minute */
  useEffect(() => {
    const id = setInterval(() => {
      setTickets((prev) =>
        prev.map((t) =>
          t.status !== "served" ? { ...t, elapsedMin: t.elapsedMin + 1 } : t
        )
      );
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const updateStatus = (id, status) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    // Also update orderRows status when kitchen marks ready/served
    if (status === "ready" || status === "served") {
      const ticket = tickets.find((t) => t.id === id);
      if (ticket?.orderId) {
        // Status sync handled via orderId if needed
      }
    }
  };

  const resetAll = () => {
    setTickets(TICKETS);
    setKitchenQueue([]);
  };

  const active = tickets.filter((t) => t.status !== "served");
  const served = tickets.filter((t) => t.status === "served");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <ChefHat className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Kitchen Display</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Color rails: amber = new · blue = preparing · green = ready
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs">
            {COLUMNS.map((col) => {
              const count = active.filter((t) => t.status === col.key).length;
              return (
                <span key={col.key} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${col.dot}`} />
                  <span className={`font-bold ${col.accent}`}>{count}</span>
                  <span className="text-zinc-600">{col.label}</span>
                </span>
              );
            })}
          </div>
          <button type="button" onClick={resetAll}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-zinc-600" /> Timer color: <span className="text-zinc-400">normal</span> · <span className="text-amber-400">8m+ warn</span> · <span className="text-red-400">15m+ urgent</span></span>
      </div>

      {/* 3-column board */}
      <div className="grid gap-6 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTickets = active.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              {/* Column header */}
              <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${col.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${col.dot}`} />
                  <span className={`text-sm font-bold ${col.accent}`}>{col.label}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badge}`}>
                  {colTickets.length}
                </span>
              </div>

              {/* Tickets */}
              {colTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
                  <ChefHat className="size-8 text-zinc-800" />
                  <p className="text-xs text-zinc-700">No {col.label.toLowerCase()} tickets</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {colTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      col={col}
                      onAction={updateStatus}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Served tickets */}
      {served.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">
            Served ({served.length})
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {served.map((ticket) => (
              <div key={ticket.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/50 bg-zinc-900/30 px-4 py-3 opacity-50">
                <div>
                  <p className="font-mono text-xs text-zinc-500">{ticket.id}</p>
                  <p className="text-sm font-medium text-zinc-400">
                    {ticket.table !== "—" ? `Table ${ticket.table}` : ticket.customer}
                  </p>
                </div>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
