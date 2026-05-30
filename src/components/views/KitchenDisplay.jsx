"use client";

import {
  CheckCircle2, ChefHat, Clock,
  Flame, RefreshCw, UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";

/* ── Column config ── */
const COLUMNS = [
  { key: "new",       label: "New",       accent: "text-amber-400",   headerBg: "bg-amber-500/10 border-amber-500/20",     borderLeft: "border-l-amber-400",   badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",   dot: "bg-amber-400"   },
  { key: "preparing", label: "Preparing", accent: "text-sky-400",     headerBg: "bg-sky-500/10 border-sky-500/20",         borderLeft: "border-l-sky-400",     badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",         dot: "bg-sky-400"     },
  { key: "ready",     label: "Ready",     accent: "text-emerald-400", headerBg: "bg-emerald-500/10 border-emerald-500/20", borderLeft: "border-l-emerald-400", badge: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25", dot: "bg-emerald-400" },
];

/* ── Elapsed timer badge ── */
function ElapsedBadge({ createdAt, elapsedMin }) {
  const [mins, setMins] = useState(() => {
    if (elapsedMin != null) return elapsedMin;
    if (createdAt) return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return 0;
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (createdAt) setMins(Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
      else setMins((m) => m + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, [createdAt]);

  const urgent = mins >= 15;
  const warn   = mins >= 8;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      urgent ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25" :
      warn   ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25" :
               "bg-zinc-800 text-zinc-500"
    }`}>
      <Clock className="size-3" />{mins}m
    </span>
  );
}

function customerLabel(order) {
  if (typeof order?.customer === "string" && order.customer.trim()) return order.customer.trim();
  if (order?.customerInfo?.name) return order.customerInfo.name;
  return null;
}

function sortKitchenOrders(list) {
  return [...list].sort(
    (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
  );
}

/* ── Order type pill ── */
function TypePill({ type }) {
  const cfg = {
    "dine-in":  { label: "Dine-In",  color: "text-emerald-400" },
    "takeaway": { label: "Takeaway", color: "text-indigo-400"  },
    "delivery": { label: "Delivery", color: "text-sky-400"     },
  };
  const c = cfg[type] ?? { label: type, color: "text-zinc-500" };
  return <span className={`text-[10px] font-semibold uppercase tracking-wide ${c.color}`}>{c.label}</span>;
}

/* ── Ticket card ── */
function TicketCard({ ticket, col, onAction, updating }) {
  const isUpdating = updating === ticket.id;
  const orderType = ticket.orderType ?? ticket.type ?? "dine-in";
  const placedAt = ticket.placedAt ?? (ticket.createdAt
    ? new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—");
  const headline = ticket.tableNumber
    ? `Table ${ticket.tableNumber}`
    : customerLabel(ticket) ?? (orderType === "delivery" ? "Delivery order" : "Takeaway");
  const items = ticket.items ?? [];

  return (
    <article className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-md shadow-black/20 border-l-4 ${col.borderLeft} transition-all duration-200 hover:border-zinc-700`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-semibold text-emerald-400">
              {ticket.orderId ?? ticket.id?.slice(-8).toUpperCase()}
            </p>
            <ElapsedBadge createdAt={ticket.createdAt} elapsedMin={ticket.elapsedMin} />
          </div>
          <p className="text-base font-bold text-zinc-100">{headline}</p>
          <div className="flex items-center gap-2">
            <TypePill type={orderType} />
            <span className="text-zinc-700">·</span>
            <span className="text-xs text-zinc-600">{placedAt}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${col.badge}`}>
          {col.label}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5 p-4">
        {items.length === 0 ? (
          <li className="rounded-lg bg-zinc-950/50 px-3 py-2 text-xs text-zinc-500">No items listed</li>
        ) : (
          items.map((it, idx) => (
            <li key={idx} className="rounded-lg bg-zinc-950/50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-300">
                  {it.qty}
                </span>
                <span className="font-medium text-zinc-100">{it.name}</span>
              </div>
              {it.note?.trim() && (
                <p className="mt-1 pl-7 text-xs font-medium text-amber-400">{it.note.trim()}</p>
              )}
            </li>
          ))
        )}
        {ticket.notes?.trim() && (
          <li className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
            <span className="font-semibold text-amber-300/90">Order note:</span> {ticket.notes.trim()}
          </li>
        )}
      </ul>

      {/* Action button */}
      <div className="border-t border-zinc-800/80 p-3">
        {ticket.status === "new" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "preparing")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/15 py-2.5 text-sm font-bold text-sky-300 ring-1 ring-sky-500/25 transition-all hover:bg-sky-500/25 active:scale-[0.98] disabled:opacity-50">
            <Flame className="size-4" />
            {isUpdating ? "Updating…" : "Start Cooking"}
          </button>
        )}
        {ticket.status === "preparing" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "ready")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 active:scale-[0.98] disabled:opacity-50">
            <CheckCircle2 className="size-4" />
            {isUpdating ? "Updating…" : "Mark Ready"}
          </button>
        )}
        {ticket.status === "ready" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "completed")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-sm font-semibold text-zinc-300 transition-all hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50">
            <UtensilsCrossed className="size-4" />
            {isUpdating ? "Updating…" : "Mark Served"}
          </button>
        )}
      </div>
    </article>
  );
}

/* ══════════════════════════════════════
   MAIN KITCHEN DISPLAY
══════════════════════════════════════ */
export default function KitchenDisplay() {
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updating, setUpdating] = useState(null); // id being updated
  const [lastRefresh, setLastRefresh] = useState(null);

  /* ── Fetch active orders from DB ── */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setFetchError("");
    try {
      const res  = await fetch("/api/orders", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        // Kitchen: new, preparing, ready — oldest first (FIFO)
        const active = sortKitchenOrders(
          data.orders.filter((o) => ["new", "preparing", "ready"].includes(o.status))
        );
        setOrders(active);
        setLastRefresh(new Date());
      } else {
        setFetchError(data.error ?? "Could not load kitchen queue.");
      }
    } catch {
      setFetchError("Network error while loading orders.");
    } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useLiveRefresh(fetchOrders);

  /* ── Update order status via API ── */
  const handleAction = useCallback(async (id, status) => {
    setUpdating(id);
    setActionError("");
    try {
      const res  = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        if (status === "completed") {
          setOrders((prev) => prev.filter((o) => o.id !== id));
        } else {
          setOrders((prev) =>
            sortKitchenOrders(prev.map((o) => (o.id === id ? { ...o, status } : o)))
          );
        }
      } else {
        setActionError(data.error ?? "Failed to update order.");
      }
    } catch {
      setActionError("Network error. Try again.");
    } finally { setUpdating(null); }
  }, []);

  const active   = orders.filter((o) => o.status !== "completed");
  const colCount = (key) => active.filter((o) => o.status === key).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-10 animate-pulse rounded-xl bg-zinc-800" />
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="h-40 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(fetchError || actionError) && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {fetchError || actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            <ChefHat className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Kitchen Display</h1>
            <p className="mt-1 text-sm text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
              {lastRefresh
                ? ` · updated ${lastRefresh.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : " · Loading…"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live counts */}
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs">
            {COLUMNS.map((col) => (
              <span key={col.key} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <span className={`font-bold ${col.accent}`}>{colCount(col.key)}</span>
                <span className="text-zinc-600">{col.label}</span>
              </span>
            ))}
          </div>
          <button type="button" onClick={() => fetchOrders()}
            className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-500 hover:border-zinc-600 hover:text-zinc-300 transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Timer legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-zinc-600" />
          Timer: <span className="text-zinc-400">normal</span>
          <span className="mx-1">·</span>
          <span className="text-amber-400">8m+ warn</span>
          <span className="mx-1">·</span>
          <span className="text-red-400">15m+ urgent</span>
        </span>
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-800 py-24 text-center">
          <ChefHat className="size-12 text-zinc-700" />
          <div>
            <p className="text-base font-semibold text-zinc-400">Kitchen is clear</p>
            <p className="mt-1 text-sm text-zinc-600">No active orders right now.</p>
          </div>
        </div>
      )}

      {/* 3-column Kanban board */}
      {active.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTickets = active.filter((o) => o.status === col.key);
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
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-800 py-10 text-center">
                    <ChefHat className="size-7 text-zinc-800" />
                    <p className="text-xs text-zinc-700">No {col.label.toLowerCase()} orders</p>
                  </div>
                ) : (
                  <div className="max-h-[calc(100vh-14rem)] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
                    {colTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        col={col}
                        onAction={handleAction}
                        updating={updating}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
