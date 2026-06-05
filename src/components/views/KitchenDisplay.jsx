"use client";

import {
  CheckCircle2, ChefHat, Clock,
  Flame, RefreshCw, UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { adminShell } from "@/config/adminSurfaceClasses";

/* ── Column config ── */
const COLUMNS = [
  { key: "new",       label: "New",       accent: "text-amber-400",   headerBg: "bg-amber-500/10 border-amber-500/20",     borderLeft: "border-l-amber-400",   badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",   dot: "bg-amber-400"   },
  { key: "preparing", label: "Preparing", accent: "text-sky-400",     headerBg: "bg-sky-500/10 border-sky-500/20",         borderLeft: "border-l-sky-400",     badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",         dot: "bg-sky-400"     },
  { key: "ready",     label: "Ready",     accent: "text-ra-primary", headerBg: "bg-ra-primary-10 border-ra-primary-20", borderLeft: "border-l-ra-accent", badge: "bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25", dot: "bg-ra-accent" },
];

function elapsedMinutes(createdAt, elapsedMin) {
  if (elapsedMin != null && Number.isFinite(Number(elapsedMin))) {
    return Math.min(Math.max(0, Number(elapsedMin)), 999);
  }
  if (!createdAt) return 0;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.min(Math.max(0, Math.floor((Date.now() - t) / 60000)), 999);
}

/* ── Elapsed timer badge ── */
function ElapsedBadge({ createdAt, elapsedMin }) {
  const [mins, setMins] = useState(() => elapsedMinutes(createdAt, elapsedMin));

  useEffect(() => {
    const id = setInterval(() => {
      setMins(elapsedMinutes(createdAt, elapsedMin));
    }, 30_000);
    return () => clearInterval(id);
  }, [createdAt, elapsedMin]);

  const urgent = mins >= 15;
  const warn   = mins >= 8;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
      urgent ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/25" :
      warn   ? "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25" :
               "kitchen-elapsed-normal admin-surface-muted"
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
    "dine-in":  { label: "Dine-In",  color: "text-ra-primary" },
    "takeaway": { label: "Takeaway", color: "text-indigo-400"  },
    "delivery": { label: "Delivery", color: "text-sky-400"     },
  };
  const c = cfg[type] ?? { label: type, color: "admin-surface-muted" };
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
    <article className={`kitchen-ticket-card rounded-2xl border-l-4 admin-surface-card shadow-md shadow-black/20 ${col.borderLeft} transition-all duration-200`}>
      {/* Header */}
      <div className={`flex items-start justify-between gap-2 p-4 ${adminShell.dividerB}`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-semibold text-ra-primary">
              {ticket.orderId ?? ticket.id?.slice(-8).toUpperCase()}
            </p>
            <ElapsedBadge createdAt={ticket.createdAt} elapsedMin={ticket.elapsedMin} />
          </div>
          <p className="text-base font-bold admin-shell-text">{headline}</p>
          <div className="flex items-center gap-2">
            <TypePill type={orderType} />
            <span className="admin-surface-faint">·</span>
            <span className="text-xs admin-surface-faint">{placedAt}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${col.badge}`}>
          {col.label}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5 p-4">
        {items.length === 0 ? (
          <li className="kitchen-item-row rounded-lg px-3 py-2 text-xs admin-surface-muted">No items listed</li>
        ) : (
          items.map((it, idx) => (
            <li key={idx} className="kitchen-item-row rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="kitchen-qty-badge flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold">
                  {it.qty}
                </span>
                <span className="font-medium admin-shell-text">{it.name}</span>
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
      <div className={`p-3 ${adminShell.dividerT}`}>
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
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary py-2.5 text-sm font-bold text-zinc-950 shadow-ra-primary-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50">
            <CheckCircle2 className="size-4" />
            {isUpdating ? "Updating…" : "Mark Ready"}
          </button>
        )}
        {ticket.status === "ready" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "completed")}
            className="kitchen-mark-served cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50">
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
                <div key={j} className="h-40 animate-pulse admin-surface-card" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="kitchen-display space-y-6">
      {(fetchError || actionError) && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError || actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-ra-primary-15 text-ra-primary ring-1 ring-ra-primary-25">
            <ChefHat className="size-5" />
          </span>
          <div>
            <h1 className="admin-page-title text-2xl font-semibold tracking-tight">Kitchen Display</h1>
            <p className="mt-1 text-sm admin-surface-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-ra-accent" />
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
          <div className="flex items-center gap-3 admin-surface-card px-4 py-2 text-xs">
            {COLUMNS.map((col) => (
              <span key={col.key} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${col.dot}`} />
                <span className={`font-bold ${col.accent}`}>{colCount(col.key)}</span>
                <span className="admin-surface-faint">{col.label}</span>
              </span>
            ))}
          </div>
          <button type="button" onClick={() => fetchOrders()}
            className="cursor-pointer flex items-center gap-1.5 admin-surface-card px-3 py-2 text-xs font-medium admin-surface-muted hover:border-zinc-600 hover:admin-surface-body transition-colors">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Timer legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs admin-surface-muted">
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5 admin-surface-faint" />
          Timer: <span className="admin-surface-muted">normal</span>
          <span className="mx-1">·</span>
          <span className="text-amber-400">8m+ warn</span>
          <span className="mx-1">·</span>
          <span className="text-red-400">15m+ urgent</span>
        </span>
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed admin-shell-border py-24 text-center">
          <ChefHat className="size-12 text-zinc-700" />
          <div>
            <p className="text-base font-semibold admin-surface-muted">Kitchen is clear</p>
            <p className="mt-1 text-sm admin-surface-faint">No active orders right now.</p>
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
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed admin-shell-border py-10 text-center">
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
