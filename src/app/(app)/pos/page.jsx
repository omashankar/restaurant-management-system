"use client";

import CategoryTabs from "@/components/pos/CategoryTabs";
import MenuCard from "@/components/menu/MenuCard";
import OrderSummary from "@/components/pos/OrderSummary";
import { POS_CATEGORIES, POS_MENU_ITEMS } from "@/components/pos/mockData";
import ItemTypeFilter from "@/components/filters/ItemTypeFilter";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import { useMenuFilter } from "@/hooks/useMenuFilter";
import { useModuleData } from "@/context/ModuleDataContext";
import { useCallback, useEffect, useMemo, useState } from "react";

const KITCHEN_LABELS = {
  default_kitchen: "Default Kitchen",
  veg_kitchen: "Veg Kitchen",
  non_veg_kitchen: "Non-Veg Kitchen",
};

export default function PosPage() {
  const { setCustomerRows, setOrderRows, setKitchenQueue, floorTables, setFloorTables } = useModuleData();
  const [orderType, setOrderType] = useState("dine-in");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [delivery, setDelivery] = useState({ name: "", phone: "", address: "" });
  const [cart, setCart] = useState([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [kitchenRouting, setKitchenRouting] = useState({});

  const {
    filtered: filteredItems,
    activeCategory, setActiveCategory,
    activeItemType, setActiveItemType,
    fastOnly, setFastOnly,
    search, setSearch,
  } = useMenuFilter(POS_MENU_ITEMS);

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const addItem = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: 1 }];
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

  const deliveryValid = delivery.name.trim() && delivery.phone.trim() && delivery.address.trim();
  const canPlaceOrder =
    cart.length > 0 &&
    !!selectedCustomer &&
    (orderType === "takeaway" ||
      (orderType === "dine-in" && selectedTableId) ||
      (orderType === "delivery" && deliveryValid));

  const placeOrder = useCallback(() => {
    if (!canPlaceOrder) return;

    const now = new Date();
    const orderId = `ORD-POS-${Date.now()}`;

    // Kitchen routing map
    const map = {};
    for (const l of cart) {
      const k = l.kitchenType ?? "default_kitchen";
      (map[k] ??= []).push({ name: l.name, qty: l.qty });
    }
    setKitchenRouting(map);

    // Save to shared orderRows
    const table = floorTables.find((t) => t.id === selectedTableId);
    const newOrder = {
      id: orderId,
      source: "pos",
      customer: selectedCustomer?.name ?? (orderType === "delivery" ? delivery.name : "Walk-in"),
      phone: selectedCustomer?.phone ?? delivery.phone ?? "",
      type: orderType,
      table: table?.tableNumber ?? (orderType === "dine-in" ? selectedTableId : "—"),
      address: orderType === "delivery" ? delivery.address : "",
      amount: total,
      status: "new",
      items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      itemCount: cart.reduce((s, l) => s + l.qty, 0),
      time: "Just now",
      createdAt: now.toISOString(),
    };
    setOrderRows((prev) => [newOrder, ...prev]);

    // Push to kitchen queue
    const kitchenTicket = {
      id: `K-${orderId}`,
      orderId,
      table: newOrder.table,
      orderType,
      customer: newOrder.customer,
      placedAt: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      elapsedMin: 0,
      status: "new",
      items: cart.map((l) => ({ name: l.name, qty: l.qty })),
    };
    setKitchenQueue((prev) => [kitchenTicket, ...prev]);

    // Update customer visits
    if (selectedCustomer) {
      const itemsSummary = cart.map((l) => `${l.name} ×${l.qty}`).join(", ");
      setCustomerRows((prev) =>
        prev.map((c) =>
          c.id === selectedCustomer.id
            ? {
                ...c,
                visits: (c.visits ?? 0) + 1,
                lastVisit: now.toISOString().slice(0, 10),
                orderHistory: [
                  { id: orderId, date: now.toISOString().slice(0, 10), total, items: itemsSummary },
                  ...(c.orderHistory ?? []),
                ],
              }
            : c
        )
      );
    }

    // Mark table occupied
    if (orderType === "dine-in" && selectedTableId) {
      setFloorTables((prev) =>
        prev.map((t) => t.id === selectedTableId ? { ...t, status: "occupied" } : t)
      );
    }

    setSuccessOpen(true);
    setCart([]);
    setSelectedTableId("");
    setDelivery({ name: "", phone: "", address: "" });
    setSelectedCustomer(null);
  }, [canPlaceOrder, cart, orderType, selectedTableId, selectedCustomer, delivery, total,
      floorTables, setOrderRows, setKitchenQueue, setCustomerRows, setFloorTables]);

  useEffect(() => {
    const h = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") setOrderType("dine-in");
      if (e.key === "2") setOrderType("takeaway");
      if (e.key === "3") setOrderType("delivery");
      if (e.key === "/") { e.preventDefault(); document.querySelector("input[type='search']")?.focus(); }
      if (e.key === "Escape") setCart([]);
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); placeOrder(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [placeOrder]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">POS</h1>
        <p className="mt-1 text-sm text-zinc-500">1 Dine-In · 2 Takeaway · 3 Delivery · / Search · Ctrl+Enter Place</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-10">
        {/* ── Menu panel ── */}
        <section className="space-y-4 xl:col-span-7">
          <CategoryTabs categories={POS_CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} />
          <ItemTypeFilter activeItemType={activeItemType} onItemTypeChange={setActiveItemType} fastOnly={fastOnly} onFastToggle={setFastOnly} />
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search menu (/)"
            endSlot={<span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">{filteredItems.length} items</span>}
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
              <p className="col-span-full py-12 text-center text-sm text-zinc-600">No items match the current filters.</p>
            )}
          </div>
        </section>

        {/* ── Order summary (contains order type + table + customer) ── */}
        <section className="xl:col-span-3">
          <OrderSummary
            cart={cart}
            subtotal={subtotal} tax={tax} total={total}
            canPlaceOrder={canPlaceOrder}
            onPlaceOrder={placeOrder}
            onClearCart={() => setCart([])}
            onInc={incrementQty} onDec={decrementQty}
            onRemove={removeLine} onSetQuantity={setLineQty}
            orderType={orderType} onOrderTypeChange={setOrderType}
            selectedTableId={selectedTableId} onTableSelect={setSelectedTableId}
            delivery={delivery} onDeliveryChange={(f, v) => setDelivery((p) => ({ ...p, [f]: v }))}
            onCustomerSelect={setSelectedCustomer}
            selectedCustomer={selectedCustomer}
          />
        </section>
      </div>

      {/* ── Success modal ── */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Order Placed"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setSuccessOpen(false)} className="cursor-pointer rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400">
              New Order
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {selectedCustomer && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2">
              <p className="text-[10px] text-zinc-500">Customer</p>
              <p className="text-sm font-semibold text-emerald-300">{selectedCustomer.name} · {selectedCustomer.phone}</p>
            </div>
          )}
          <p className="text-sm text-zinc-400">Kitchen tickets dispatched:</p>
          {Object.entries(kitchenRouting).map(([k, items]) => (
            <div key={k} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{KITCHEN_LABELS[k] ?? k}</p>
              <ul className="space-y-1">
                {items.map((it, i) => (
                  <li key={i} className="flex justify-between text-sm text-zinc-300">
                    <span>{it.name}</span><span className="text-zinc-500">×{it.qty}</span>
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
