"use client";

import { useUser } from "@/context/AuthContext";
import {
  Bike, CheckCircle2, ChevronDown, ChevronUp,
  Clock, ConciergeBell, Plus, RefreshCw,
  Search, Store, UtensilsCrossed, X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* ── Config ── */
const STATUS_CFG = {
  new:       { label: "New",       badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",   border: "border-amber-500/30"   },
  preparing: { label: "Preparing", badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",         border: "border-sky-500/20"     },
  ready:     { label: "Ready",     badge: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25", border: "border-emerald-500/30" },
  completed: { label: "Completed", badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",      border: "border-zinc-800"       },
  cancelled: { label: "Cancelled", badge: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",         border: "border-zinc-800"       },
};

const TYPE_ICON = {
  "dine-in":  { Icon: Store,         color: "text-emerald-400", bg: "bg-emerald-500/10" },
  "takeaway": { Icon: ConciergeBell, color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  "delivery": { Icon: Bike,          color: "text-sky-400",     bg: "bg-sky-500/10"     },
};

const PAYMENT_STATUS_CFG = {
  paid: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25",
  pending: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  initiated: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  processing: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25",
  failed: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
};

const PAYMENT_METHOD_LABEL = {
  cod: "COD",
  cashCounter: "Cash Counter",
  upi: "UPI",
  card: "Card",
  netBanking: "Net Banking",
  wallet: "Wallet",
  payLater: "Pay Later",
  bankTransfer: "Bank Transfer",
};

const NEXT_STATUS = { new: "preparing", preparing: "ready", ready: "completed" };
const NEXT_LABEL  = { new: "Start Preparing", preparing: "Mark Ready", ready: "Mark Completed" };

/* ── Order card ── */
function OrderCard({ order, onStatusChange, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const st = STATUS_CFG[order.status] ?? STATUS_CFG.completed;
  const tp = TYPE_ICON[order.type ?? order.orderType] ?? TYPE_ICON["dine-in"];
  const { Icon: TypeIcon } = tp;
  const paymentStatus = String(order.payment?.status ?? "pending");
  const paymentMethod = String(order.payment?.method ?? "cod");
  const next = NEXT_STATUS[order.status];

  const handleNext = async () => {
    if (!next || !canEdit) return;
    setUpdating(true);
    await onStatusChange(order.id, next);
    setUpdating(false);
  };

  const timeStr = order.time ?? (order.createdAt
    ? new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "—");

  return (
    <div className={`rounded-2xl border bg-zinc-900/70 shadow-sm transition-all duration-200 hover:shadow-md ${st.border}`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tp.bg}`}>
              <TypeIcon className={`size-4 ${tp.color}`} />
            </span>
            <div>
              <p className="font-mono text-sm font-semibold text-emerald-400">
                {order.orderId ?? order.id?.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs text-zinc-500">
                {order.tableNumber ? `Table ${order.tableNumber}` : (order.type ?? order.orderType) === "delivery" ? "Delivery" : "Takeaway"}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${st.badge}`}>
            {st.label}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-zinc-400">{order.customer}</p>
          <p className="text-base font-bold text-zinc-100">${Number(order.total ?? order.amount ?? 0).toFixed(2)}</p>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">
            {PAYMENT_METHOD_LABEL[paymentMethod] ?? paymentMethod}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${PAYMENT_STATUS_CFG[paymentStatus] ?? PAYMENT_STATUS_CFG.pending}`}>
            {paymentStatus}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
            <Clock className="size-3" /> {timeStr}
          </span>
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors">
            {expanded ? <><ChevronUp className="size-3" /> Less</> : <><ChevronDown className="size-3" /> Details</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 space-y-2">
          {/* Items list */}
          {order.items?.length > 0 && (
            <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{item.qty}× {item.name}</span>
                  <span className="text-zinc-500">${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          {order.notes && (
            <p className="text-xs text-amber-400/80 border-t border-zinc-800 pt-2">Note: {order.notes}</p>
          )}
          {/* Status action */}
          {canEdit && next && (
            <button type="button" onClick={handleNext} disabled={updating}
              className={`cursor-pointer mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all disabled:opacity-50 ${
                next === "preparing" ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25 hover:bg-sky-500/25"
                : next === "ready"   ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                :                      "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}>
              <CheckCircle2 className="size-3.5" />
              {updating ? "Updating…" : NEXT_LABEL[order.status]}
            </button>
          )}
          {canEdit && order.status === "new" && (
            <button type="button" onClick={() => onStatusChange(order.id, "cancelled")}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl border border-zinc-800 py-1.5 text-xs text-zinc-500 hover:border-red-500/30 hover:text-red-400 transition-colors">
              <X className="size-3" /> Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create Order Modal ── */
function CreateOrderModal({ open, onClose, onCreated }) {
  const [tables, setTables]   = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart]       = useState([]);
  const [form, setForm]       = useState({ orderType: "dine-in", tableNumber: "", customer: "", notes: "" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");

  useEffect(() => {
    if (!open) return;
    setCart([]); setError(""); setSearch("");
    setForm({ orderType: "dine-in", tableNumber: "", customer: "", notes: "" });
    Promise.all([fetch("/api/tables"), fetch("/api/menu?status=active")])
      .then(([t, m]) => Promise.all([t.json(), m.json()]))
      .then(([td, md]) => {
        if (td.success) setTables(td.tables.filter((t) => t.status === "available"));
        if (md.success) setMenuItems(md.items);
      }).catch(() => {});
  }, [open]);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menuItems;
    return menuItems.filter((m) => m.name.toLowerCase().includes(q) || (m.categoryName ?? "").toLowerCase().includes(q));
  }, [menuItems, search]);

  const addItem = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === item.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const removeItem = (id) => setCart((prev) => prev.filter((l) => l.id !== id));
  const total = cart.reduce((s, l) => s + l.price * l.qty, 0);

  const submit = async () => {
    if (!cart.length) { setError("Add at least one item."); return; }
    if (form.orderType === "dine-in" && !form.tableNumber) { setError("Select a table for dine-in."); return; }
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cart, orderType: form.orderType, tableNumber: form.tableNumber || null, customer: form.customer, notes: form.notes }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Failed to create order."); return; }
      onCreated(data.order);
      onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="cursor-pointer absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-bold text-zinc-50">New Order</h2>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — menu */}
          <div className="flex flex-1 flex-col border-r border-zinc-800 overflow-hidden">
            <div className="p-3 border-b border-zinc-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search menu…"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredMenu.map((item) => (
                <button key={item.id} type="button" onClick={() => addItem(item)}
                  className="cursor-pointer flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2.5 text-left hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{item.name}</p>
                    <p className="text-xs text-zinc-500">{item.categoryName}</p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">${Number(item.price).toFixed(2)}</span>
                </button>
              ))}
              {filteredMenu.length === 0 && <p className="py-8 text-center text-xs text-zinc-600">No items found.</p>}
            </div>
          </div>

          {/* Right — order details */}
          <div className="flex w-64 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* Order type */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Order Type</label>
                <select value={form.orderType} onChange={(e) => setForm((f) => ({ ...f, orderType: e.target.value, tableNumber: "" }))}
                  className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                  <option value="dine-in">Dine-In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* Table (dine-in) */}
              {form.orderType === "dine-in" && (
                <div>
                  <label className="text-xs font-medium text-zinc-500">Table *</label>
                  <select value={form.tableNumber} onChange={(e) => setForm((f) => ({ ...f, tableNumber: e.target.value }))}
                    className="cursor-pointer mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40">
                    <option value="">— Select —</option>
                    {tables.map((t) => <option key={t.id} value={t.tableNumber}>{t.tableNumber} ({t.capacity}p)</option>)}
                  </select>
                </div>
              )}

              {/* Customer */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Customer</label>
                <input value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
                  placeholder="Walk-in"
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-zinc-500">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Special requests…"
                  className="mt-1 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600" />
              </div>

              {/* Cart */}
              <div>
                <p className="text-xs font-medium text-zinc-500 mb-1.5">Items ({cart.length})</p>
                {cart.length === 0 ? (
                  <p className="text-xs text-zinc-600 py-3 text-center">No items added</p>
                ) : (
                  <div className="space-y-1.5">
                    {cart.map((line) => (
                      <div key={line.id} className="flex items-center justify-between rounded-lg bg-zinc-950/40 px-2.5 py-2 text-xs">
                        <span className="text-zinc-300">{line.qty}× {line.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">${(line.price * line.qty).toFixed(2)}</span>
                          <button type="button" onClick={() => removeItem(line.id)}
                            className="cursor-pointer text-zinc-600 hover:text-red-400 transition-colors">
                            <X className="size-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-zinc-800 p-3 space-y-2">
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex justify-between text-sm font-bold">
                <span className="text-zinc-400">Total</span>
                <span className="text-emerald-400">${total.toFixed(2)}</span>
              </div>
              <button type="button" onClick={submit} disabled={saving || !cart.length}
                className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-zinc-950 hover:bg-emerald-400 disabled:opacity-40 transition-all">
                {saving ? "Placing…" : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default function OrdersPage() {
  const { user } = useUser();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [sortNew, setSortNew]   = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const canEdit = ["admin", "manager", "waiter"].includes(user?.role);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch { /* keep existing */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = useCallback(async (id, status) => {
    const res  = await fetch(`/api/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const data = await res.json();
    if (data.success) {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    }
  }, []);

  const handleCreated = useCallback((order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const summary = useMemo(() => {
    const counts = { new: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => { if (counts[o.status] !== undefined) counts[o.status]++; });
    return counts;
  }, [orders]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? orders : orders.filter((o) => o.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((o) =>
        (o.orderId ?? o.id ?? "").toLowerCase().includes(q) ||
        (o.customer ?? "").toLowerCase().includes(q) ||
        (o.tableNumber ?? "").toLowerCase().includes(q)
      );
    }
    return sortNew ? list : [...list].reverse();
  }, [filter, search, sortNew, orders]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-800" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/40" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
              <UtensilsCrossed className="size-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Orders</h1>
              <p className="mt-1 text-sm text-zinc-500">{orders.length} total · live status</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={fetchOrders}
              className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
              <RefreshCw className="size-3.5" />
            </button>
            <button type="button" onClick={() => setSortNew((v) => !v)}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors">
              <Clock className="size-3.5" />
              {sortNew ? "Newest first" : "Oldest first"}
            </button>
            {canEdit && (
              <button type="button" onClick={() => setCreateOpen(true)}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98]">
                <Plus className="size-4" /> New Order
              </button>
            )}
          </div>
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
            <button key={key} type="button"
              onClick={() => setFilter(filter === key ? "all" : key)}
              className={`cursor-pointer rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 ${bg} ${border} ${filter === key ? "ring-1 ring-current" : ""}`}>
              <p className={`text-xl font-bold ${color}`}>{summary[key]}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order, customer, table…"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-emerald-500/40" />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 py-20 text-center">
            <UtensilsCrossed className="size-10 text-zinc-700" />
            <p className="text-sm text-zinc-500">No orders found.</p>
            {canEdit && (
              <button type="button" onClick={() => setCreateOpen(true)}
                className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-emerald-400">
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onStatusChange={handleStatusChange} canEdit={canEdit} />
            ))}
          </div>
        )}
      </div>

      <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </>
  );
}
