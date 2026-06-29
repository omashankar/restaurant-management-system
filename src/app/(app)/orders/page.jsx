"use client";

import { raIconBadgeCls, raInputCls, raSpinnerCls, raTextareaCls, raPageRefreshBtnCls, raPagePrimaryBtnCls } from "@/config/restaurantAdminTheme";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useUser } from "@/context/AuthContext";
import { formatAdminMoney } from "@/lib/adminCurrency";
import {
  Bike, CheckCircle2, ChevronDown, ChevronUp,
  Clock, ConciergeBell, Plus, RefreshCw,
  Search, Store, UtensilsCrossed, X,
} from "lucide-react";
import {
  EMPTY_CREATE_ORDER_ERRORS,
  getCreateOrderFieldErrors,
  hasInlineFieldErrors,
} from "@/lib/formValidation";
import SearchField from "@/components/ui/SearchField";
import PaginationBar from "@/components/ui/PaginationBar";
import { adminModalOverlay, adminSurface } from "@/config/adminSurfaceClasses";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLiveRefresh } from "@/hooks/useLiveRefresh";

const ORDERS_PAGE_SIZE = 12;

/* ── Config ── */
const STATUS_CFG = {
  new:       { label: "New",       badge: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",   border: "border-amber-500/30"   },
  preparing: { label: "Preparing", badge: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",         border: "border-sky-500/20"     },
  ready:     { label: "Ready",     badge: "bg-ra-primary-15 text-ra-primary-muted ring-1 ring-ra-primary-25", border: "border-ra-primary-30" },
  completed: { label: "Completed", badge: "bg-zinc-500/15 text-zinc-400 ring-1 ring-zinc-500/25",      border: "admin-shell-border"       },
  cancelled: { label: "Cancelled", badge: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",         border: "admin-shell-border"       },
};

const TYPE_ICON = {
  "dine-in":  { Icon: Store,         color: "text-ra-primary", bg: "bg-ra-primary-10" },
  "takeaway": { Icon: ConciergeBell, color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
  "delivery": { Icon: Bike,          color: "text-sky-400",     bg: "bg-sky-500/10"     },
};

const PAYMENT_STATUS_CFG = {
  paid: "bg-ra-primary-15 text-ra-primary-muted ring-1 ring-ra-primary-25",
  pending: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25",
  initiated: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25",
  processing: "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/25",
  failed: "bg-red-500/15 text-red-400 ring-1 ring-red-500/25",
};

const PAYMENT_METHOD_LABEL = {
  cod: "COD",
  cashCounter: "Cash",
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
function OrderCard({ order, currency, onStatusChange, onMarkPaid, canEdit }) {
  const { formatOrderPlacedAt } = useAdminLocale();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [payUpdating, setPayUpdating] = useState(false);
  const st = STATUS_CFG[order.status] ?? STATUS_CFG.completed;
  const tp = TYPE_ICON[order.type ?? order.orderType] ?? TYPE_ICON["dine-in"];
  const { Icon: TypeIcon } = tp;
  const paymentStatus = String(order.payment?.status ?? "pending");
  const paymentMethod = String(order.payment?.method ?? "cod");
  const next = NEXT_STATUS[order.status];
  const orderTotal = Number(order.total ?? order.amount ?? 0);

  const handleNext = async () => {
    if (!next || !canEdit) return;
    setUpdating(true);
    await onStatusChange(order.id, next);
    setUpdating(false);
  };

  const handleMarkPaid = async () => {
    if (!canEdit || paymentStatus === "paid") return;
    setPayUpdating(true);
    await onMarkPaid?.(order.id);
    setPayUpdating(false);
  };

  const placedAt = formatOrderPlacedAt(order.createdAt);
  const timeStr = order.time ?? placedAt.label;

  return (
    <div className={`min-w-0 rounded-2xl border admin-surface-card transition-colors ${st.border}`}>
      <div className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${tp.bg}`}>
              <TypeIcon className={`size-4 ${tp.color}`} />
            </span>
            <div className="min-w-0">
              <p
                className="truncate font-mono text-sm font-semibold text-ra-primary"
                title={String(order.orderId ?? order.id ?? "")}
              >
                {order.orderId ?? order.id?.slice(-8).toUpperCase()}
              </p>
              <p className="text-xs admin-surface-muted">
                {order.tableNumber ? `Table ${order.tableNumber}` : (order.type ?? order.orderType) === "delivery" ? "Delivery" : "Takeaway"}
              </p>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${st.badge}`}>
            {st.label}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 flex-1 break-all text-sm admin-surface-muted">{order.customer}</p>
          <p className="shrink-0 text-base font-bold tabular-nums admin-shell-text">{formatAdminMoney(orderTotal, currency)}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border admin-shell-border px-2 py-0.5 text-[11px] admin-surface-body">
            {PAYMENT_METHOD_LABEL[paymentMethod] ?? paymentMethod}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${PAYMENT_STATUS_CFG[paymentStatus] ?? PAYMENT_STATUS_CFG.pending}`}>
            {paymentStatus}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 text-xs admin-surface-faint"
            title={order.createdAt ? placedAt.full : undefined}
          >
            <Clock className="size-3" /> {timeStr}
          </span>
          <button type="button" onClick={() => setExpanded((v) => !v)}
            className="cursor-pointer inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-shell-text transition-colors">
            {expanded ? <><ChevronUp className="size-3" /> Less</> : <><ChevronDown className="size-3" /> Details</>}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="admin-surface-divider-t px-4 py-3 space-y-2">
          {order.createdAt && placedAt.full !== "—" && (
            <p className="text-[11px] admin-surface-faint">
              Placed: <span className="text-zinc-400">{placedAt.full}</span>
            </p>
          )}
          {/* Items list */}
          {order.items?.length > 0 && (
            <div className="space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 flex-1 break-words text-zinc-400">{item.qty}× {item.name}</span>
                    <span className="shrink-0 tabular-nums text-zinc-500">
                      {formatAdminMoney((item.price ?? 0) * (item.qty ?? 1), currency)}
                    </span>
                  </div>
                  {item.note?.trim() && (
                    <p className="mt-0.5 break-words pl-3 text-[10px] text-amber-400/90">↳ {item.note}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {(order.subtotal != null || order.discountAmount > 0 || order.taxAmount > 0 || order.serviceCharge > 0) && (
            <div className="space-y-0.5 admin-surface-divider-t pt-2 text-[11px] admin-surface-faint">
              {order.subtotal != null && (
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatAdminMoney(order.subtotal, currency)}</span>
                </div>
              )}
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400/90">
                  <span>
                    Discount{order.discountPercent > 0 ? ` (${order.discountPercent}%)` : ""}
                  </span>
                  <span>−{formatAdminMoney(order.discountAmount, currency)}</span>
                </div>
              )}
              {order.taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tax{order.taxPercent ? ` (${order.taxPercent}%)` : ""}</span>
                  <span>{formatAdminMoney(order.taxAmount, currency)}</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span>Service</span>
                  <span>{formatAdminMoney(order.serviceCharge, currency)}</span>
                </div>
              )}
            </div>
          )}
          {order.notes && (
            <p className="break-words text-xs text-amber-400/80 admin-surface-divider-t pt-2">Note: {order.notes}</p>
          )}
          {canEdit && paymentStatus !== "paid" && (
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={payUpdating}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl border border-ra-primary-30 bg-ra-primary-10 py-2 text-xs font-semibold text-ra-primary-muted hover:bg-ra-primary/20 disabled:opacity-50"
            >
              {payUpdating ? "Updating…" : "Mark payment as Paid"}
            </button>
          )}
          {/* Status action */}
          {canEdit && next && (
            <button type="button" onClick={handleNext} disabled={updating}
              className={`cursor-pointer mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all disabled:opacity-50 ${
                next === "preparing" ? "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/25 hover:bg-sky-500/25"
                : next === "ready"   ? "bg-ra-primary text-zinc-950 hover:brightness-110"
                :                      "admin-surface-segment-btn admin-surface-body"
              }`}>
              <CheckCircle2 className="size-3.5" />
              {updating ? "Updating…" : NEXT_LABEL[order.status]}
            </button>
          )}
          {canEdit && order.status === "new" && (
            <button type="button" onClick={() => onStatusChange(order.id, "cancelled")}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl border admin-shell-border py-1.5 text-xs admin-surface-muted transition-colors hover-border-red-30 hover-red-danger">
              <X className="size-3" /> Cancel Order
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Create Order Modal ── */
function CreateOrderModal({ open, onClose, onCreated, currency = "INR" }) {
  const [tables, setTables]   = useState([]);
  const [areas, setAreas]     = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart]       = useState([]);
  const [form, setForm]       = useState({ orderType: "dine-in", tableNumber: "", customer: "", notes: "" });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [taxPercent, setTaxPercent] = useState(0);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cashCounter");
  const [paymentStatus, setPaymentStatus] = useState("paid");
  const [fieldErrors, setFieldErrors] = useState(EMPTY_CREATE_ORDER_ERRORS);

  const orderValidation = useMemo(
    () => getCreateOrderFieldErrors({ form, cart }),
    [form, cart]
  );
  const canPlaceOrder = orderValidation.valid;

  useEffect(() => {
    if (!open) return;
    setCart([]); setError(""); setSearch("");
    setFieldErrors(EMPTY_CREATE_ORDER_ERRORS);
    setForm({ orderType: "dine-in", tableNumber: "", customer: "", notes: "" });
    setPaymentMethod("cashCounter");
    setPaymentStatus("paid");
    Promise.all([
      fetch("/api/tables"),
      fetch("/api/table-areas"),
      fetch("/api/menu?status=active"),
      fetch("/api/settings"),
    ])
      .then(([t, a, m, s]) => Promise.all([t.json(), a.json(), m.json(), s.json()]))
      .then(([td, ad, md, sd]) => {
        if (td.success) setTables(td.tables.filter((t) => t.status === "available"));
        if (ad.success) setAreas(ad.areas);
        if (md.success) setMenuItems(md.items);
        if (sd.success) {
          setTaxPercent(parseFloat(sd.settings?.pos?.taxPercentage ?? "0") || 0);
          setServiceChargePercent(parseFloat(sd.settings?.pos?.serviceCharge ?? "0") || 0);
        }
      }).catch(() => {});
  }, [open]);

  const areaNameById = useMemo(
    () => Object.fromEntries(areas.map((a) => [a.id, a.name])),
    [areas]
  );

  const tablesByArea = useMemo(() => {
    const groups = new Map();
    for (const table of tables) {
      const areaId = table.categoryId ?? "";
      const areaName = areaId ? (areaNameById[areaId] ?? "Unknown area") : "No area assigned";
      if (!groups.has(areaId)) {
        groups.set(areaId, { areaId, areaName, tables: [] });
      }
      groups.get(areaId).tables.push(table);
    }
    return [...groups.values()]
      .map((g) => ({
        ...g,
        tables: [...g.tables].sort((a, b) =>
          String(a.tableNumber).localeCompare(String(b.tableNumber), undefined, { numeric: true })
        ),
      }))
      .sort((a, b) => {
        if (!a.areaId) return 1;
        if (!b.areaId) return -1;
        return a.areaName.localeCompare(b.areaName);
      });
  }, [tables, areaNameById]);

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
  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const taxAmount = parseFloat(((subtotal * taxPercent) / 100).toFixed(2));
  const serviceCharge = parseFloat(((subtotal * serviceChargePercent) / 100).toFixed(2));
  const total = parseFloat((subtotal + taxAmount + serviceCharge).toFixed(2));

  const submit = async () => {
    const validation = getCreateOrderFieldErrors({ form, cart });
    setFieldErrors(validation.errors);
    if (!validation.valid) return;
    setSaving(true); setError("");
    try {
      const res  = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({
            name: l.name,
            qty: l.qty,
            price: l.price,
            menuItemId: l.id,
          })),
          orderType: form.orderType,
          tableNumber: form.tableNumber || null,
          customer: form.customer,
          notes: form.notes,
          subtotal,
          taxAmount,
          taxPercent,
          serviceCharge,
          serviceChargePercent,
          paymentMethod,
          paymentStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? "Failed to create order."); return; }
      onCreated(data.order);
      onClose();
    } catch { setError("Network error."); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className={`${adminModalOverlay} p-0 sm:p-4`}>
      <button type="button" className="cursor-pointer absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 flex max-h-[min(95dvh,900px)] w-full min-w-0 max-w-full flex-col rounded-t-2xl border admin-shell-border admin-surface-card-solid shadow-2xl sm:max-h-[90vh] sm:max-w-3xl sm:rounded-2xl"
        style={{ paddingBottom: "max(0px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-[var(--admin-border)]" aria-hidden />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between admin-surface-divider-b px-4 py-4 sm:px-5">
          <h2 className={`text-base font-bold ${adminSurface.title}`}>New Order</h2>
          <button type="button" onClick={onClose} className={`cursor-pointer rounded-lg p-2 ${adminSurface.muted} hover:bg-[var(--admin-hover)] hover:admin-shell-text`}>
            <X className="size-5" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* Left — menu */}
          <div className="flex shrink-0 flex-col border-b admin-shell-border lg:max-h-none lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:border-b-0 lg:border-r">
            <div className="shrink-0 p-3 admin-surface-divider-b">
              <SearchField
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu…"
                clearable
                inputClassName="focus-ra-primary"
              />
            </div>
            <div className="min-h-[11rem] flex-1 overflow-y-auto p-3 space-y-1.5 lg:min-h-0">
              {filteredMenu.map((item) => (
                <button key={item.id} type="button" onClick={() => addItem(item)}
                  className="cursor-pointer flex w-full items-start justify-between gap-2 rounded-xl admin-surface-card px-3 py-2.5 text-left hover:border-ra-primary-30 hover:bg-ra-primary-5 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-medium admin-shell-text">{item.name}</p>
                    <p className="truncate text-xs admin-surface-muted">{item.categoryName}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-ra-primary">
                    {formatAdminMoney(item.price, currency)}
                  </span>
                </button>
              ))}
              {filteredMenu.length === 0 && <p className="py-8 text-center text-xs admin-surface-faint">No items found.</p>}
            </div>
          </div>

          {/* Right — order details */}
          <div className="flex w-full shrink-0 flex-col lg:w-72 lg:overflow-hidden">
            <div className="flex-1 space-y-3 overflow-visible p-3 lg:overflow-y-auto">
              {/* Order type */}
              <div>
                <label className="text-xs font-medium admin-surface-muted">Order Type</label>
                <select
                  value={form.orderType}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, orderType: e.target.value, tableNumber: "" }));
                    setFieldErrors(EMPTY_CREATE_ORDER_ERRORS);
                    setError("");
                  }}
                  className={`cursor-pointer mt-1 ${raInputCls}`}
                >
                  <option value="dine-in">Dine-In</option>
                  <option value="takeaway">Takeaway</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* Table (dine-in) */}
              {form.orderType === "dine-in" && (
                <div>
                  <label className="text-xs font-medium admin-surface-muted">Table *</label>
                  <select
                    value={form.tableNumber}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, tableNumber: e.target.value }));
                      if (fieldErrors.tableNumber) {
                        setFieldErrors((p) => ({ ...p, tableNumber: "" }));
                      }
                      setError("");
                    }}
                    aria-invalid={fieldErrors.tableNumber ? true : undefined}
                    className={`cursor-pointer mt-1 ${raInputCls} ${
                      fieldErrors.tableNumber ? "border-red-500/50" : ""
                    }`}
                  >
                    <option value="">— Select table —</option>
                    {tablesByArea.map((group) => (
                      <optgroup key={group.areaId || "unassigned"} label={group.areaName}>
                        {group.tables.map((t) => (
                          <option key={t.id} value={t.tableNumber}>
                            {t.tableNumber} ({t.capacity}p)
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {tables.length === 0 && (
                    <p className="mt-1 text-[10px] text-amber-400/90">
                      No available tables. Add tables under Tables → Tables List, or mark occupied tables as Available.
                    </p>
                  )}
                  {fieldErrors.tableNumber && (
                    <p className="mt-1 text-xs text-red-400">{fieldErrors.tableNumber}</p>
                  )}
                </div>
              )}

              {/* Customer */}
              <div>
                <label className="text-xs font-medium admin-surface-muted">
                  {form.orderType === "delivery" ? "Customer name" : "Customer"}
                  <span className="text-red-400"> *</span>
                </label>
                <input
                  value={form.customer}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, customer: e.target.value }));
                    if (fieldErrors.customer) setFieldErrors((p) => ({ ...p, customer: "" }));
                    setError("");
                  }}
                  placeholder={form.orderType === "delivery" ? "e.g. Rahul Sharma" : "e.g. Rahul Sharma (not Walk-in)"}
                  aria-invalid={fieldErrors.customer ? true : undefined}
                  className={`mt-1 ${raInputCls} ${
                    fieldErrors.customer ? "border-red-500/50" : ""
                  }`}
                />
                {fieldErrors.customer && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.customer}</p>
                )}
              </div>

              {/* Notes / delivery address */}
              <div>
                <label className="text-xs font-medium admin-surface-muted">
                  {form.orderType === "delivery" ? "Delivery address" : "Notes"}
                  {form.orderType === "delivery" ? <span className="text-red-400"> *</span> : null}
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, notes: e.target.value }));
                    if (fieldErrors.notes) setFieldErrors((p) => ({ ...p, notes: "" }));
                    setError("");
                  }}
                  placeholder={
                    form.orderType === "delivery"
                      ? "House no., street, area, city…"
                      : "Special requests…"
                  }
                  aria-invalid={fieldErrors.notes ? true : undefined}
                  className={`mt-1 ${raTextareaCls} ${
                    fieldErrors.notes ? "border-red-500/50" : ""
                  }`}
                />
                {fieldErrors.notes && (
                  <p className="mt-1 text-xs text-red-400">{fieldErrors.notes}</p>
                )}
              </div>

              {/* Cart */}
              <div>
                <p className="text-xs font-medium admin-surface-muted mb-1.5">Items ({cart.length})</p>
                {cart.length === 0 ? (
                  <p className="text-xs admin-surface-faint py-3 text-center">No items added</p>
                ) : (
                  <div className="space-y-1.5">
                    {cart.map((line) => (
                      <div key={line.id} className="flex items-start justify-between gap-2 rounded-lg admin-surface-segment-track px-2.5 py-2 text-xs">
                        <span className="min-w-0 flex-1 break-words admin-surface-body">{line.qty}× {line.name}</span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-ra-primary">
                            {formatAdminMoney(line.price * line.qty, currency)}
                          </span>
                          <button type="button" onClick={() => removeItem(line.id)}
                            className="cursor-pointer text-zinc-600 transition-colors hover-red-danger">
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
            <div className="admin-surface-divider-t p-3 space-y-2">
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="space-y-0.5 text-xs admin-surface-muted">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatAdminMoney(subtotal, currency)}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax ({taxPercent}%)</span>
                    <span>{formatAdminMoney(taxAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold admin-shell-text">
                  <span>Total</span>
                  <span className="text-ra-primary">{formatAdminMoney(total, currency)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
                {["cashCounter", "upi", "card", "cod"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m);
                      if (m === "cod") setPaymentStatus("pending");
                      else setPaymentStatus("paid");
                    }}
                    className={`cursor-pointer rounded-lg border box-border py-2 text-[10px] font-semibold transition-[background-color,color] sm:flex-1 sm:py-1 ${
                      paymentMethod === m
                        ? "border-ra-primary/25 bg-ra-primary/20 text-ra-primary-muted"
                        : "border-[var(--admin-border-subtle)] bg-[var(--admin-hover)] text-zinc-500 hover:admin-shell-text"
                    }`}
                  >
                    {PAYMENT_METHOD_LABEL[m] ?? m}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={saving || !canPlaceOrder}
                className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary py-2.5 text-sm font-bold text-zinc-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? "Placing…" : "Place Order"}
              </button>
              {!canPlaceOrder && cart.length > 0 && orderValidation.message && !error && !hasInlineFieldErrors(fieldErrors) && (
                <p className="text-center text-[10px] admin-surface-faint">{orderValidation.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Page ── */
export default function OrdersPage() {
  const { user } = useUser();
  const { formatTime } = useAdminLocale();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [sortNew, setSortNew]   = useState(true);
  const [page, setPage]         = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [summary, setSummary]   = useState({ new: 0, preparing: 0, ready: 0, completed: 0, cancelled: 0 });
  const [createOpen, setCreateOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [filter, search, sortNew]);

  const canEdit = ["admin", "manager", "waiter"].includes(user?.role);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.settings?.general?.currency) {
          setCurrency(d.settings.general.currency);
        }
      })
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setFetchError("");
    }
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ORDERS_PAGE_SIZE),
        sort: sortNew ? "newest" : "oldest",
      });
      if (filter !== "all") params.set("status", filter);
      if (search.trim()) params.set("q", search.trim());
      const res  = await fetch(`/api/orders?${params}`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        if (data.pagination) setPagination(data.pagination);
        if (data.summary) setSummary(data.summary);
        setLastUpdated(new Date());
      } else if (!silent) {
        setFetchError(data.error ?? "Could not load orders.");
      }
    } catch {
      if (!silent) setFetchError("Network error while loading orders.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, filter, search, sortNew]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useLiveRefresh(() => fetchOrders(true));

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    setFetchError("");
    try {
      await fetchOrders(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  const handleStatusChange = useCallback(async (id, status) => {
    const res  = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    } else {
      setFetchError(data.error ?? "Failed to update order status.");
    }
  }, []);

  const handleMarkPaid = useCallback(async (id) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "paid" }),
    });
    const data = await res.json();
    if (data.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, payment: { ...(o.payment ?? {}), method: o.payment?.method ?? "cod", status: "paid" } }
            : o
        )
      );
    } else {
      setFetchError(data.error ?? "Failed to update payment.");
    }
  }, []);

  const handleCreated = useCallback(() => {
    setPage(1);
    fetchOrders(true);
  }, [fetchOrders]);

  const totalOrders = useMemo(
    () => Object.values(summary).reduce((s, n) => s + n, 0),
    [summary]
  );

  if (loading) {
    return (
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="h-8 w-40 animate-pulse rounded-lg admin-progress-track" />
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-24" />
            <div className="h-10 w-full animate-pulse rounded-xl admin-surface-card sm:w-32" />
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 animate-pulse admin-surface-card" />)}
        </div>
        <div className="h-10 w-full max-w-xs animate-pulse rounded-xl admin-surface-card" />
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-32 animate-pulse admin-surface-card" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        {fetchError && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {fetchError}
          </div>
        )}
        {/* Header */}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className={`mt-1 shrink-0 ${raIconBadgeCls}`}>
              <UtensilsCrossed className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="admin-page-title break-words text-xl font-semibold tracking-tight sm:text-2xl">Orders</h1>
              <p className="admin-page-desc mt-1 break-words text-sm">
                {totalOrders} total
                <span className="mt-1 block sm:mt-0 sm:inline">
                  <span className="hidden sm:inline"> · </span>
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="size-1.5 animate-pulse rounded-full bg-ra-accent" />
                    Live
                    {lastUpdated
                      ? ` · updated ${formatTime(lastUpdated, { seconds: true })}`
                      : ""}
                  </span>
                </span>
              </p>
            </div>
          </div>
          <div className="admin-page-header-actions">
            <button
              type="button"
              onClick={refreshOrders}
              disabled={refreshing}
              className={raPageRefreshBtnCls}
            >
              <RefreshCw className={`size-3.5 ${refreshing ? raSpinnerCls : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setSortNew((v) => !v)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 admin-surface-card px-4 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-600 hover:admin-shell-text sm:w-auto"
            >
              <Clock className="size-3.5" />
              {sortNew ? "Newest first" : "Oldest first"}
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className={`${raPagePrimaryBtnCls} px-4 py-2 text-sm font-bold`}
              >
                <Plus className="size-4" /> New Order
              </button>
            )}
          </div>
        </div>

        {/* Summary strip */}
        <div className="-mx-1 flex min-w-0 gap-2 overflow-x-auto scroll-px-1 px-1 pb-0.5 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0">
          {[
            { key: "new",       label: "New",       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
            { key: "preparing", label: "Preparing", color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
            { key: "ready",     label: "Ready",     color: "text-ra-primary", bg: "bg-ra-primary-10", border: "border-ra-primary-20" },
            { key: "completed", label: "Completed", color: "text-zinc-400",    bg: "bg-zinc-500/10",    border: "border-zinc-700"       },
            { key: "cancelled", label: "Cancelled", color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
          ].map(({ key, label, color, bg, border }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(filter === key ? "all" : key)}
              className={`min-w-[7.5rem] shrink-0 cursor-pointer rounded-2xl border box-border p-2.5 text-left transition-[background-color,box-shadow] sm:min-w-0 sm:p-3 sm:hover:-translate-y-0.5 ${bg} ${border} ${
                filter === key ? "ring-1 ring-inset ring-white/15" : "ring-1 ring-transparent"
              }`}
            >
              <p className={`text-lg font-bold tabular-nums sm:text-xl ${color}`}>{summary[key]}</p>
              <p className="mt-0.5 truncate text-[11px] admin-surface-muted sm:text-xs">{label}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <SearchField
          className="w-full max-w-none sm:max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order, customer, table…"
          inputClassName="focus-ra-primary"
        />

        {/* Grid */}
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 admin-surface-card px-4 py-16 text-center sm:py-20">
            <UtensilsCrossed className="size-10 text-zinc-700" />
            <p className="text-sm admin-surface-muted">No orders found.</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-ra-primary px-4 py-2 text-sm font-bold text-zinc-950 hover:brightness-110 sm:w-auto"
              >
                Create First Order
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {orders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  currency={currency}
                  onStatusChange={handleStatusChange}
                  onMarkPaid={handleMarkPaid}
                  canEdit={canEdit}
                />
              ))}
            </div>
            <div className="min-w-0">
              <PaginationBar
                page={page}
                totalPages={pagination.pages}
                total={pagination.total}
                pageSize={ORDERS_PAGE_SIZE}
                onPageChange={setPage}
                hideWhenSinglePage
              />
            </div>
          </>
        )}
      </div>

      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
        currency={currency}
      />
    </>
  );
}
