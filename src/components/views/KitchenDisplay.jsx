"use client";

import {
  CheckCircle2, ChefHat, Clock,
  Flame, RefreshCw, UtensilsCrossed,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";
import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { raIconBadgeCls, raSpinnerCls } from "@/config/restaurantAdminTheme";

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
      <Clock className="size-3 shrink-0" aria-hidden />{mins}m
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
  const { formatTime } = useAdminLocale();
  const isUpdating = updating === ticket.id;
  const orderType = ticket.orderType ?? ticket.type ?? "dine-in";
  const placedAt = ticket.placedAt ?? (ticket.createdAt ? formatTime(ticket.createdAt) : "—");
  const headline = ticket.tableNumber
    ? `Table ${ticket.tableNumber}`
    : customerLabel(ticket) ?? (orderType === "delivery" ? "Delivery order" : "Takeaway");
  const items = ticket.items ?? [];

  return (
    <article className={`kitchen-ticket-card min-w-0 rounded-2xl border-l-4 admin-surface-card shadow-md shadow-black/20 ${col.borderLeft} transition-all duration-200`}>
      {/* Header */}
      <div className={`flex flex-wrap items-start justify-between gap-2 p-3.5 sm:p-4 ${adminShell.dividerB}`}>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className="max-w-full truncate font-mono text-sm font-semibold text-ra-primary"
              title={String(ticket.orderId ?? ticket.id ?? "")}
            >
              {ticket.orderId ?? ticket.id?.slice(-8).toUpperCase()}
            </p>
            <ElapsedBadge createdAt={ticket.createdAt} elapsedMin={ticket.elapsedMin} />
          </div>
          <p className="break-words text-base font-bold leading-snug admin-shell-text">{headline}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <TypePill type={orderType} />
            <span className="admin-surface-faint" aria-hidden>·</span>
            <span className="text-xs admin-surface-faint">{placedAt}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${col.badge}`}>
          {col.label}
        </span>
      </div>

      {/* Items */}
      <ul className="space-y-1.5 p-3.5 sm:p-4">
        {items.length === 0 ? (
          <li className="kitchen-item-row rounded-lg px-3 py-2 text-xs admin-surface-muted">No items listed</li>
        ) : (
          items.map((it, idx) => (
            <li key={idx} className="kitchen-item-row rounded-lg px-3 py-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="kitchen-qty-badge flex size-5 shrink-0 items-center justify-center rounded-md text-xs font-bold tabular-nums">
                  {it.qty}
                </span>
                <span className="min-w-0 flex-1 break-words font-medium admin-shell-text">{it.name}</span>
              </div>
              {it.note?.trim() && (
                <p className="mt-1 break-words pl-7 text-xs font-medium text-amber-400">{it.note.trim()}</p>
              )}
            </li>
          ))
        )}
        {ticket.notes?.trim() && (
          <li className="break-words rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
            <span className="font-semibold text-amber-300/90">Order note:</span> {ticket.notes.trim()}
          </li>
        )}
      </ul>

      {/* Action button */}
      <div className={`p-3 ${adminShell.dividerT}`}>
        {ticket.status === "new" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "preparing")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500/15 py-2.5 text-sm font-bold text-sky-300 ring-1 ring-sky-500/25 transition-all hover:bg-sky-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            <Flame className="size-4 shrink-0" aria-hidden />
            {isUpdating ? "Updating…" : "Start Cooking"}
          </button>
        )}
        {ticket.status === "preparing" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "ready")}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary py-2.5 text-sm font-bold text-zinc-950 shadow-ra-primary-glow transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
            {isUpdating ? "Updating…" : "Mark Ready"}
          </button>
        )}
        {ticket.status === "ready" && (
          <button type="button" disabled={isUpdating}
            onClick={() => onAction(ticket.id, "completed")}
            className="kitchen-mark-served cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
            <UtensilsCrossed className="size-4 shrink-0" aria-hidden />
            {isUpdating ? "Updating…" : "Mark Served"}
          </button>
        )}
      </div>
    </article>
  );
}

function KitchenLoading() {
  const block = "animate-pulse admin-surface-card admin-surface-skeleton";
  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 size-10 shrink-0 animate-pulse rounded-xl admin-surface-card" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-7 w-44 max-w-full animate-pulse rounded-lg admin-surface-card sm:w-52" />
            <div className="h-4 w-full max-w-xs animate-pulse rounded admin-surface-card" />
          </div>
        </div>
        <div className="admin-page-header-actions">
          <div className={`h-10 w-full ${block} sm:w-56`} />
          <div className={`h-10 w-full ${block} sm:w-24`} />
        </div>
      </div>
      <div className="h-4 w-full max-w-md animate-pulse rounded admin-surface-card" />
      <div className="flex gap-4 overflow-hidden lg:grid lg:grid-cols-3 lg:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="min-w-[85vw] shrink-0 space-y-3 sm:min-w-[20rem] lg:min-w-0">
            <div className={`h-10 ${block}`} />
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className={`h-44 ${block}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN KITCHEN DISPLAY
══════════════════════════════════════ */
export default function KitchenDisplay() {
  const { formatTime } = useAdminLocale();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updating, setUpdating] = useState(null); // id being updated
  const [lastRefresh, setLastRefresh] = useState(null);

  /* ── Fetch active orders from DB ── */
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setFetchError("");
    try {
      const statuses = ["new", "preparing", "ready"];
      const responses = await Promise.all(
        statuses.map((status) =>
          fetch(`/api/orders?status=${status}&limit=100&sort=oldest`, { cache: "no-store" })
        )
      );
      const payloads = await Promise.all(responses.map((r) => r.json()));
      if (payloads.every((d) => d.success)) {
        const merged = payloads.flatMap((d) => d.orders ?? []);
        const active = sortKitchenOrders(merged);
        setOrders(active);
        setLastRefresh(new Date());
      } else {
        const err = payloads.find((d) => !d.success);
        setFetchError(err?.error ?? "Could not load kitchen queue.");
      }
    } catch {
      setFetchError("Network error while loading orders.");
    } finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useLiveRefresh(fetchOrders);

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    setFetchError("");
    try {
      await fetchOrders(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

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
    return <KitchenLoading />;
  }

  return (
    <div className={`kitchen-display min-w-0 w-full max-w-full space-y-6 overflow-x-hidden transition-opacity duration-200 sm:space-y-8 ${refreshing ? "opacity-70" : ""}`}>
      {(fetchError || actionError) && (
        <div className="break-words rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {fetchError || actionError}
        </div>
      )}

      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
            <ChefHat className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Kitchen Display</h1>
            <p className="mt-1 break-words text-sm admin-surface-muted">
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-ra-accent" aria-hidden />
                Live
              </span>
              {lastRefresh ? (
                <span className="mt-1 block sm:mt-0 sm:inline">
                  <span className="hidden sm:inline"> · </span>
                  {`updated ${formatTime(lastRefresh, { seconds: true })}`}
                </span>
              ) : (
                " · Loading…"
              )}
            </p>
          </div>
        </div>

        <div className="admin-page-header-actions">
          {/* Live counts */}
          <div className="grid w-full min-w-0 grid-cols-3 gap-2 admin-surface-card px-3 py-2 text-xs sm:flex sm:w-auto sm:items-center sm:gap-3 sm:px-4">
            {COLUMNS.map((col) => (
              <span key={col.key} className="flex min-w-0 items-center justify-center gap-1.5 sm:justify-start">
                <span className={`size-2 shrink-0 rounded-full ${col.dot}`} aria-hidden />
                <span className={`font-bold tabular-nums ${col.accent}`}>{colCount(col.key)}</span>
                <span className="truncate admin-surface-faint">{col.label}</span>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={refreshOrders}
            disabled={refreshing}
            className={`inline-flex w-full cursor-pointer items-center justify-center gap-1.5 sm:w-auto ${adminSurface.btnGhost} hover-border-ra-primary-40 disabled:opacity-50`}
          >
            <RefreshCw className={`size-3.5 ${refreshing ? raSpinnerCls : ""}`} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      {/* Timer legend */}
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs admin-surface-muted">
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Clock className="size-3.5 shrink-0 admin-surface-faint" aria-hidden />
          Timer: <span className="admin-surface-muted">normal</span>
          <span className="mx-1" aria-hidden>·</span>
          <span className="text-amber-400">8m+ warn</span>
          <span className="mx-1" aria-hidden>·</span>
          <span className="text-red-400">15m+ urgent</span>
        </span>
        {active.length > 0 ? (
          <span className="shrink-0 admin-surface-faint lg:hidden">Swipe columns →</span>
        ) : null}
      </div>

      {/* Empty state */}
      {active.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed admin-shell-border px-4 py-16 text-center sm:py-24">
          <ChefHat className="size-12 admin-surface-faint" aria-hidden />
          <div>
            <p className="text-base font-semibold admin-surface-muted">Kitchen is clear</p>
            <p className="mt-1 text-sm admin-surface-faint">No active orders right now.</p>
          </div>
        </div>
      )}

      {/* 3-column Kanban board */}
      {active.length > 0 && (
        <div
          className="flex min-w-0 gap-4 overflow-x-auto scroll-px-2 pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0 lg:[scrollbar-width:auto] [&::-webkit-scrollbar]:hidden lg:[&::-webkit-scrollbar]:block"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {COLUMNS.map((col) => {
            const colTickets = active.filter((o) => o.status === col.key);
            return (
              <div
                key={col.key}
                className="flex w-[min(100%,calc(100vw-2rem))] shrink-0 snap-center flex-col space-y-3 sm:w-[20rem] lg:w-auto lg:min-w-0 lg:shrink lg:snap-align-none"
              >
                {/* Column header */}
                <div className={`flex shrink-0 items-center justify-between rounded-xl border px-4 py-2.5 ${col.headerBg}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`size-2.5 shrink-0 rounded-full ${col.dot}`} aria-hidden />
                    <span className={`truncate text-sm font-bold ${col.accent}`}>{col.label}</span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${col.badge}`}>
                    {colTickets.length}
                  </span>
                </div>

                {/* Tickets */}
                {colTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed admin-shell-border px-4 py-10 text-center">
                    <ChefHat className="size-7 admin-surface-faint" aria-hidden />
                    <p className="text-xs admin-surface-faint">No {col.label.toLowerCase()} orders</p>
                  </div>
                ) : (
                  <div className="max-h-[min(70vh,560px)] space-y-3 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] lg:max-h-[calc(100vh-14rem)]">
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
