"use client";

import CategoryTabs from "@/components/pos/CategoryTabs";
import MenuCard from "@/components/menu/MenuCard";
import OrderSummary from "@/components/pos/OrderSummary";
import PrintInvoice from "@/components/pos/PrintInvoice";
import { triggerPosAutoPrint } from "@/lib/posPrint";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import { useMenuFilter } from "@/hooks/useMenuFilter";
import { useModuleData } from "@/context/ModuleDataContext";
import {
  EMPTY_POS_ORDER_ERRORS,
  getPosOrderFieldErrors,
} from "@/lib/formValidation";
import { resolveCustomerByPhone } from "@/lib/posCustomer";
import ItemTypeChipIcon, { FastFilterChipIcon } from "@/components/menu/ItemTypeChipIcon";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const KITCHEN_LABELS = {
  default_kitchen: "Default Kitchen",
  veg_kitchen: "Veg Kitchen",
  non_veg_kitchen: "Non-Veg Kitchen",
};

function PosPageContent() {
  const {
    customerRows,
    setCustomerRows,
    setOrderRows,
    setKitchenQueue,
    floorTables,
    setFloorTables,
    menuItems,
    categories,
  } = useModuleData();
  const searchParams = useSearchParams();

  const activeMenuItems = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);
  // Only show categories that have at least one active menu item
  const posCategories = useMemo(() => {
    const catIds = new Set(activeMenuItems.map((m) => m.categoryId));
    return [{ id: "all", name: "All" }, ...categories.filter((c) => catIds.has(c.id))];
  }, [categories, activeMenuItems]);

  // Only show item types that have at least one active menu item
  const availableItemTypes = useMemo(() => {
    return [...new Set(activeMenuItems.map((m) => m.itemType).filter(Boolean))];
  }, [activeMenuItems]);
  const [orderType, setOrderType] = useState("dine-in");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [delivery, setDelivery] = useState({ name: "", phone: "", address: "" });
  const [cart, setCart] = useState([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [lastOrder, setLastOrder] = useState(null); // for print invoice

  // Pre-select table from ?tableId= query param (set by floor view)
  useEffect(() => {
    const tableId = searchParams.get("tableId");
    if (tableId) {
      setSelectedTableId(tableId);
      setOrderType("dine-in");
    }
  }, [searchParams]);
  const [kitchenRouting, setKitchenRouting] = useState({});

  // ── POS settings: tax % and service charge % from restaurant settings ──
  const [taxPercent, setTaxPercent]                     = useState(0);
  const [serviceChargePercent, setServiceChargePercent] = useState(0);
  const [roundOffTotal, setRoundOffTotal]               = useState(false);
  const [currency, setCurrency]                         = useState("INR");
  const [restaurantName, setRestaurantName]             = useState("Restaurant");
  const [printers, setPrinters]                         = useState([]);
  const settingsFetchedRef = useRef(false);

  useEffect(() => {
    if (settingsFetchedRef.current) return;
    settingsFetchedRef.current = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTaxPercent(parseFloat(d.settings?.pos?.taxPercentage ?? "0")    || 0);
          setServiceChargePercent(parseFloat(d.settings?.pos?.serviceCharge ?? "0") || 0);
          setRoundOffTotal(Boolean(d.settings?.pos?.roundOffTotal));
          setCurrency(d.settings?.general?.currency ?? "INR");
          setRestaurantName(d.settings?.general?.restaurantName?.trim() || "Restaurant");
        }
      })
      .catch(() => {});
    fetch("/api/printer-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPrinters(Array.isArray(d.printers) ? d.printers : []);
      })
      .catch(() => {});
  }, []);

  const {
    filtered: filteredItems,
    activeCategory, setActiveCategory,
    activeItemType, setActiveItemType,
    fastOnly, setFastOnly,
    search, setSearch,
  } = useMenuFilter(activeMenuItems);

  const subtotal      = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const taxAmount     = parseFloat(((subtotal * taxPercent)           / 100).toFixed(2));
  const serviceCharge = parseFloat(((subtotal * serviceChargePercent) / 100).toFixed(2));
  const total         = useMemo(() => {
    let value = parseFloat((subtotal + taxAmount + serviceCharge).toFixed(2));
    if (roundOffTotal) value = Math.round(value);
    return value;
  }, [subtotal, taxAmount, serviceCharge, roundOffTotal]);

  const addItem = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: 1, note: "" }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
    setLastAddedId(item.id);
    setTimeout(() => setLastAddedId(""), 300);
  };

  const incrementQty = (id) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l));
  const decrementQty = (id) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: Math.max(1, l.qty - 1) } : l).filter((l) => l.qty > 0));
  const removeLine   = (id) => setCart((p) => p.filter((l) => l.id !== id));
  const setLineQty   = (id, v) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: Math.max(1, parseInt(v, 10) || 1) } : l));

  const [fieldErrors, setFieldErrors] = useState(EMPTY_POS_ORDER_ERRORS);

  const posOrderValidation = useMemo(
    () =>
      getPosOrderFieldErrors({
        orderType,
        selectedTableId,
        selectedCustomer,
        delivery,
      }),
    [orderType, selectedTableId, selectedCustomer, delivery]
  );

  const canPlaceOrder = cart.length > 0 && posOrderValidation.valid;

  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cashCounter");
  const [paymentStatus, setPaymentStatus] = useState("paid");

  useEffect(() => {
    if (paymentMethod === "cod") setPaymentStatus("pending");
    else if (paymentStatus === "pending" && paymentMethod !== "cod") {
      setPaymentStatus("paid");
    }
  }, [paymentMethod]);

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  const handleOrderTypeChange = useCallback((type) => {
    setOrderType(type);
    setSelectedTableId("");
    setFieldErrors(EMPTY_POS_ORDER_ERRORS);
    setPlaceError("");
    if (type === "delivery") setSelectedCustomer(null);
  }, []);

  const setLineNote = (id, noteText) =>
    setCart((p) => p.map((l) => (l.id === id ? { ...l, note: noteText } : l)));

  const placeOrder = useCallback(async () => {
    if (cart.length === 0) {
      setPlaceError("Add at least one item to the cart.");
      return;
    }
    const validation = getPosOrderFieldErrors({
      orderType,
      selectedTableId,
      selectedCustomer,
      delivery,
    });
    setFieldErrors(validation.errors);
    if (!validation.valid) {
      setPlaceError(validation.message ?? "Please fix the highlighted fields.");
      return;
    }
    if (isPlacing) return;
    setIsPlacing(true);
    setPlaceError("");

    const now = new Date();

    // Kitchen routing map (with per-item notes)
    const map = {};
    for (const l of cart) {
      const k = l.kitchenType ?? "default_kitchen";
      (map[k] ??= []).push({ name: l.name, qty: l.qty, note: l.note?.trim() || undefined });
    }
    setKitchenRouting(map);

    const table = floorTables.find((t) => t.id === selectedTableId);
    let activeCustomer = selectedCustomer;

    if (orderType === "delivery") {
      const resolved = await resolveCustomerByPhone({
        name: delivery.name,
        phone: delivery.phone,
        customerRows,
        setCustomerRows,
      });
      if (resolved && !resolved.ephemeral) activeCustomer = resolved;
    }

    const customerName =
      activeCustomer?.name ??
      (orderType === "delivery" ? delivery.name.trim() : "Walk-in");
    const tableNumber = table?.tableNumber ?? (orderType === "dine-in" ? selectedTableId : null);
    const orderNotes =
      [note.trim(), orderType === "delivery" ? `Address: ${delivery.address.trim()}` : ""]
        .filter(Boolean)
        .join(" · ");

    // Persist to MongoDB
    try {
      const res  = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((l) => ({
            name: l.name,
            qty: l.qty,
            price: l.price,
            menuItemId: l.id,
            note: l.note?.trim() || undefined,
          })),
          orderType,
          tableNumber,
          customer: customerName,
          notes: orderNotes,
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
      if (!data.success) {
        setPlaceError(data.error ?? "Failed to place order.");
        setIsPlacing(false);
        return;
      }

      const orderId = data.order?.orderId ?? `ORD-POS-${Date.now()}`;

      // Sync into shared in-memory context so Orders/Kitchen pages update live
      const newOrder = {
        id:        orderId,
        orderId,
        source:    "pos",
        customer:  customerName,
        phone:     activeCustomer?.phone ?? delivery.phone ?? "",
        type:      orderType,
        orderType,
        table:     tableNumber ?? "—",
        tableNumber: tableNumber ?? null,
        address:   orderType === "delivery" ? delivery.address : "",
        total,
        amount:    total,
        status:    "new",
        payment:   { method: paymentMethod, status: paymentStatus },
        items:     cart.map((l) => ({
          name: l.name,
          qty: l.qty,
          price: l.price,
          note: l.note?.trim() || undefined,
        })),
        itemCount: cart.reduce((s, l) => s + l.qty, 0),
        time:      "Just now",
        createdAt: now.toISOString(),
      };
      setOrderRows((prev) => [newOrder, ...prev]);

      // Push to kitchen queue
      const kitchenTicket = {
        id:         `K-${orderId}`,
        orderId,
        table:      newOrder.table,
        orderType,
        customer:   newOrder.customer,
        placedAt:   now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        elapsedMin: 0,
        status:     "new",
        items:      cart.map((l) => ({
          name: l.name,
          qty: l.qty,
          note: l.note?.trim() || undefined,
        })),
      };
      setKitchenQueue((prev) => [kitchenTicket, ...prev]);

      // Update customer visits (local + database)
      if (activeCustomer?.id) {
        const visitDate = now.toISOString().slice(0, 10);
        const itemsSummary = cart.map((l) => `${l.name} ×${l.qty}`).join(", ");
        const nextVisits = (activeCustomer.visits ?? 0) + 1;
        const nextHistory = [
          { id: orderId, date: visitDate, total, items: itemsSummary },
          ...(activeCustomer.orderHistory ?? []),
        ].slice(0, 50);
        setCustomerRows((prev) =>
          prev.map((c) =>
            c.id === activeCustomer.id
              ? {
                  ...c,
                  visits: nextVisits,
                  lastVisit: visitDate,
                  orderHistory: nextHistory,
                }
              : c
          )
        );
        fetch(`/api/customers/${activeCustomer.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visits: nextVisits,
            lastVisit: visitDate,
            orderHistory: nextHistory,
          }),
        }).catch(() => {});
      }

      // Mark table occupied
      if (orderType === "dine-in" && selectedTableId) {
        setFloorTables((prev) =>
          prev.map((t) => t.id === selectedTableId ? { ...t, status: "occupied" } : t)
        );
      }

      setSuccessOpen(true);
      setLastOrder({
        orderId,
        orderType,
        tableNumber,
        customer: customerName,
        phone: selectedCustomer?.phone ?? delivery.phone ?? "",
        items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        subtotal,
        taxAmount,
        taxPercent,
        serviceCharge,
        serviceChargePercent,
        total,
        currency,
      });

      triggerPosAutoPrint({
        printers,
        restaurantName,
        lastOrder: {
          orderId,
          orderType,
          tableNumber,
          customer: customerName,
          items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
          subtotal,
          taxAmount,
          taxPercent,
          serviceCharge,
          serviceChargePercent,
          total,
          currency,
        },
        kitchenRouting: map,
      });

      setCart([]);
      setNote("");
      setSelectedTableId("");
      setDelivery({ name: "", phone: "", address: "" });
      setSelectedCustomer(null);
      setFieldErrors(EMPTY_POS_ORDER_ERRORS);
      setPaymentMethod("cashCounter");
      setPaymentStatus("paid");
    } catch {
      setPlaceError("Network error. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  }, [canPlaceOrder, isPlacing, cart, orderType, selectedTableId, selectedCustomer, delivery, total, subtotal,
      taxAmount, taxPercent, serviceCharge, serviceChargePercent, currency, note, paymentMethod, paymentStatus,
      customerRows, floorTables, setOrderRows, setKitchenQueue, setCustomerRows, setFloorTables, printers, restaurantName]);

  useEffect(() => {
    const h = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") handleOrderTypeChange("dine-in");
      if (e.key === "2") handleOrderTypeChange("takeaway");
      if (e.key === "3") handleOrderTypeChange("delivery");
      if (e.key === "/") { e.preventDefault(); document.querySelector("input[type='search']")?.focus(); }
      if (e.key === "Escape") setCart([]);
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); placeOrder(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [placeOrder, handleOrderTypeChange]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="admin-page-title text-2xl font-semibold tracking-tight">POS</h1>
        <p className="admin-page-desc mt-1 text-sm">1 Dine-In · 2 Takeaway · 3 Delivery · / Search · Ctrl+Enter Place</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-10">
        {/* ── Menu panel ── */}
        <section className="space-y-4 xl:col-span-7">
          <CategoryTabs categories={posCategories} activeCategory={activeCategory} onChange={setActiveCategory} />
          {/* Item type filters with signs */}
          <div className="flex flex-wrap items-center gap-2">
            {["all", "veg", "non-veg", "egg", "drink", "halal", "other"].filter((t) =>
              t === "all" || availableItemTypes.includes(t)
            ).map((t) => {
              const active = activeItemType === t;
              const LABELS = { all: "All Types", veg: "Veg", "non-veg": "Non-Veg", egg: "Egg", drink: "Drink", halal: "Halal", other: "Other" };
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setActiveItemType(t)}
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                    active
                      ? "bg-ra-primary/20 text-ra-primary ring-1 ring-ra-primary-25"
                      : "border admin-shell-border bg-[var(--admin-surface)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
                  }`}
                  aria-pressed={active}
                >
                  {t !== "all" && <ItemTypeChipIcon type={t} />}
                  {LABELS[t]}
                </button>
              );
            })}
            {/* Fast toggle */}
            <button
              type="button"
              onClick={() => setFastOnly((v) => !v)}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                fastOnly
                  ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                  : "admin-surface-card admin-surface-muted ring-1 admin-shell-border hover:admin-shell-text"
              }`}
              aria-pressed={fastOnly}
            >
              <FastFilterChipIcon />
              Fast (&lt;10 min)
            </button>
          </div>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search menu (/)"
            endSlot={<span className="rounded-lg border admin-shell-border px-2.5 py-1 text-xs text-zinc-400">{filteredItems.length} items</span>}
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                variant="pos"
                item={item}
                onAdd={addItem}
                isPopping={lastAddedId === item.id}
              />
            ))}
            {filteredItems.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm admin-surface-faint">No items match the current filters.</p>
            )}
          </div>
        </section>

        {/* ── Order summary (contains order type + table + customer) ── */}
        <section className="xl:col-span-3">
          {placeError && (
            <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {placeError}
            </div>
          )}
          <OrderSummary
            cart={cart}
            subtotal={subtotal}
            taxAmount={taxAmount} taxPercent={taxPercent}
            serviceCharge={serviceCharge} serviceChargePercent={serviceChargePercent}
            total={total}
            currency={currency}
            canPlaceOrder={canPlaceOrder && !isPlacing}
            onPlaceOrder={placeOrder}
            onClearCart={() => setCart([])}
            onInc={incrementQty} onDec={decrementQty}
            onRemove={removeLine} onSetQuantity={setLineQty} onSetLineNote={setLineNote}
            orderType={orderType} onOrderTypeChange={handleOrderTypeChange}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={setPaymentMethod}
            paymentStatus={paymentStatus}
            onPaymentStatusChange={setPaymentStatus}
            selectedTableId={selectedTableId} onTableSelect={setSelectedTableId}
            delivery={delivery} onDeliveryChange={(f, v) => setDelivery((p) => ({ ...p, [f]: v }))}
            onCustomerSelect={setSelectedCustomer}
            selectedCustomer={selectedCustomer}
            isPlacing={isPlacing}
            note={note}
            onNoteChange={setNote}
            fieldErrors={fieldErrors}
            onClearFieldError={clearFieldError}
          />
        </section>
      </div>

      {/* ── Success modal ── */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Order Placed"
        footer={
          <div className="flex justify-between gap-2">
            {lastOrder && (
              <PrintInvoice
                orderId={lastOrder.orderId}
                orderType={lastOrder.orderType}
                tableNumber={lastOrder.tableNumber}
                customer={lastOrder.customer}
                items={lastOrder.items}
                subtotal={lastOrder.subtotal}
                taxAmount={lastOrder.taxAmount}
                taxPercent={lastOrder.taxPercent}
                serviceCharge={lastOrder.serviceCharge}
                serviceChargePercent={lastOrder.serviceChargePercent}
                total={lastOrder.total}
                currency={lastOrder.currency}
                restaurantName={restaurantName}
                paperSize={printers.find((p) => p.printInvoice)?.paperSize ?? "80mm"}
              />
            )}
            <button type="button" onClick={() => setSuccessOpen(false)} className="cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110">
              New Order
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {lastOrder?.customer && (
            <div className="rounded-xl border border-ra-primary-25 bg-ra-primary-5 px-3 py-2">
              <p className="text-[10px] admin-surface-faint">Customer</p>
              <p className="text-sm font-semibold text-ra-primary-muted">
                {lastOrder.customer}{lastOrder.phone ? ` · ${lastOrder.phone}` : ""}
              </p>
            </div>
          )}
          <p className="text-sm admin-surface-muted">Kitchen tickets dispatched:</p>
          {Object.entries(kitchenRouting).map(([k, items]) => (
            <div key={k} className="admin-surface-card p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{KITCHEN_LABELS[k] ?? k}</p>
              <ul className="space-y-1">
                {items.map((it, i) => (
                  <li key={i} className="text-sm admin-surface-body">
                    <div className="flex justify-between">
                      <span>{it.name}</span>
                      <span className="text-zinc-500">×{it.qty}</span>
                    </div>
                    {it.note && (
                      <p className="mt-0.5 text-[11px] text-amber-400/90">↳ {it.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

export default function PosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm admin-surface-muted">
          Loading POS…
        </div>
      }
    >
      <PosPageContent />
    </Suspense>
  );
}
