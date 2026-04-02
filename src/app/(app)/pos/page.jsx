"use client";

import CategoryTabs from "@/components/pos/CategoryTabs";
import MenuItemCard from "@/components/pos/MenuItemCard";
import OrderSummary from "@/components/pos/OrderSummary";
import TableSelector from "@/components/pos/TableSelector";
import { POS_CATEGORIES, POS_MENU_ITEMS, POS_TABLES } from "@/components/pos/mockData";
import ListToolbar from "@/components/ui/ListToolbar";
import Modal from "@/components/ui/Modal";
import { Bike, ConciergeBell, Store } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function PosPage() {
  const [orderType, setOrderType] = useState("dine-in");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [delivery, setDelivery] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState("");

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return POS_MENU_ITEMS.filter((item) => {
      const matchCategory = activeCategory === "All" ? true : item.category === activeCategory;
      const matchSearch = query
        ? `${item.name} ${item.category}`.toLowerCase().includes(query)
        : true;
      return matchCategory && matchSearch;
    });
  }, [activeCategory, search]);

  const subtotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.price * line.qty, 0),
    [cart]
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const addItem = (item) => {
    setCart((prev) => {
      const idx = prev.findIndex((line) => line.id === item.id);
      if (idx === -1) return [...prev, { ...item, qty: 1 }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
    setLastAddedId(item.id);
    setTimeout(() => setLastAddedId(""), 300);
  };

  const incrementQty = (id) => {
    setCart((prev) => prev.map((line) => (line.id === id ? { ...line, qty: line.qty + 1 } : line)));
  };

  const decrementQty = (id) => {
    setCart((prev) =>
      prev
        .map((line) => (line.id === id ? { ...line, qty: Math.max(1, line.qty - 1) } : line))
        .filter((line) => line.qty > 0)
    );
  };

  const removeLine = (id) => {
    setCart((prev) => prev.filter((line) => line.id !== id));
  };

  const setLineQty = (id, qtyValue) => {
    const qty = Math.max(1, parseInt(qtyValue, 10) || 1);
    setCart((prev) => prev.map((line) => (line.id === id ? { ...line, qty } : line)));
  };

  const deliveryValid =
    delivery.name.trim() && delivery.phone.trim() && delivery.address.trim();

  const canPlaceOrder =
    cart.length > 0 &&
    (orderType === "takeaway" ||
      (orderType === "dine-in" && selectedTableId) ||
      (orderType === "delivery" && deliveryValid));

  const placeOrder = useCallback(() => {
    if (!canPlaceOrder) return;
    setSuccessOpen(true);
    setCart([]);
    setSelectedTableId("");
    setDelivery({ name: "", phone: "", address: "" });
  }, [canPlaceOrder]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (event.key === "1") setOrderType("dine-in");
      if (event.key === "2") setOrderType("takeaway");
      if (event.key === "3") setOrderType("delivery");
      if (event.key === "/") {
        event.preventDefault();
        document.querySelector("input[type='search']")?.focus();
      }
      if (event.key === "Escape") {
        setCart([]);
      }
      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        placeOrder();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [placeOrder]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">POS</h1>
          <p className="mt-1 text-sm text-zinc-500">
            1 Dine-In, 2 Takeaway, 3 Delivery, / Search, Ctrl+Enter Place
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "dine-in", label: "Dine-In", Icon: Store },
            { id: "takeaway", label: "Takeaway", Icon: ConciergeBell },
            { id: "delivery", label: "Delivery", Icon: Bike },
          ].map(({ id, label, Icon }) => {
            const active = orderType === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOrderType(id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  active
                    ? "bg-emerald-500 text-zinc-950"
                    : "bg-zinc-950 text-zinc-300 ring-1 ring-zinc-800 hover:bg-zinc-800"
                }`}
                aria-pressed={active}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        {orderType === "dine-in" ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Select Table
            </p>
            <TableSelector
              tables={POS_TABLES}
              selectedTableId={selectedTableId}
              onSelect={setSelectedTableId}
            />
          </div>
        ) : null}

        {orderType === "delivery" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={delivery.name}
              onChange={(e) => setDelivery((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Customer Name"
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
            <input
              value={delivery.phone}
              onChange={(e) => setDelivery((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
            <input
              value={delivery.address}
              onChange={(e) => setDelivery((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Address"
              className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-10">
        <section className="space-y-4 xl:col-span-7">
          <CategoryTabs
            categories={POS_CATEGORIES}
            activeCategory={activeCategory}
            onChange={setActiveCategory}
          />

          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search menu (/)"
            endSlot={
              <span className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
                {filteredItems.length} items
              </span>
            }
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onAdd={addItem}
                isPopping={lastAddedId === item.id}
              />
            ))}
          </div>
        </section>

        <section className="xl:col-span-3">
          <OrderSummary
            cart={cart}
            subtotal={subtotal}
            tax={tax}
            total={total}
            canPlaceOrder={canPlaceOrder}
            onPlaceOrder={placeOrder}
            onClearCart={() => setCart([])}
            onInc={incrementQty}
            onDec={decrementQty}
            onRemove={removeLine}
            onSetQuantity={setLineQty}
          />
        </section>
      </div>

      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Order Placed Successfully"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSuccessOpen(false)}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-400"
            >
              New Order
            </button>
          </div>
        }
      >
        <p className="text-sm text-zinc-400">
          Order has been queued for processing. You can start the next order now.
        </p>
      </Modal>
    </div>
  );
}
