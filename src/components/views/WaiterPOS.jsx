"use client";

import MenuItemCard from "@/components/rms/MenuItemCard";
import TableCard from "@/components/rms/TableCard";
import { useModuleData } from "@/context/ModuleDataContext";
import { Check, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export default function WaiterPOS() {
  const { menuItems, floorTables } = useModuleData();

  // Only active menu items and available tables
  const activeItems     = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);
  const availableTables = useMemo(() => floorTables.filter((t) => t.status === "available"), [floorTables]);

  const [step, setStep]                   = useState(1);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart]                   = useState([]);

  const total = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);

  const addItem = (item) => {
    setCart((prev) => {
      const i = prev.findIndex((p) => p.id === item.id);
      if (i === -1) return [...prev, { ...item, qty: 1 }];
      const next = [...prev];
      next[i] = { ...next[i], qty: next[i].qty + 1 };
      return next;
    });
  };

  const removeLine = (id) => setCart((prev) => prev.filter((p) => p.id !== id));

  const placeOrder = () => {
    setStep(4);
    setTimeout(() => { setCart([]); setSelectedTable(null); setStep(1); }, 2200);
  };

  const tableData = availableTables.map((t) => ({
    id: t.id,
    name: t.tableNumber,
    status: t.status,
    seats: t.capacity,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Service POS</h1>
        <p className="mt-1 text-sm admin-surface-muted">Select table → add items → place order → next guest.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{ n: 1, label: "Table" }, { n: 2, label: "Menu" }, { n: 3, label: "Review" }, { n: 4, label: "Done" }].map((s) => (
          <button key={s.n} type="button" onClick={() => setStep(Math.min(s.n, step))}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-all ${
              step === s.n ? "bg-ra-primary text-zinc-950" : step > s.n ? "bg-zinc-800 admin-surface-body" : "bg-zinc-900 admin-surface-faint ring-1 ring-zinc-800"
            }`}>
            {s.n}. {s.label}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold admin-surface-body">Select a table</h2>
          {tableData.length === 0 ? (
            <p className="text-sm admin-surface-faint">No available tables. Check the Tables module.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {tableData.map((t) => (
                <TableCard key={t.id} table={t} selected={selectedTable?.id === t.id}
                  onSelect={(tbl) => { setSelectedTable(tbl); setStep(2); }} />
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold admin-surface-body">Menu — {selectedTable?.name ?? "Table"}</h2>
              <button type="button" onClick={() => setStep(1)} className="cursor-pointer text-xs font-medium text-ra-primary hover:text-ra-primary-muted">Change table</button>
            </div>
            {activeItems.length === 0 ? (
              <p className="text-sm admin-surface-faint">No menu items. Add items in the Menu module.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeItems.map((item) => <MenuItemCard key={item.id} item={item} onAdd={addItem} />)}
              </div>
            )}
          </div>
          <aside className="admin-surface-card p-4 xl:sticky xl:top-24 xl:self-start">
            <h3 className="text-sm font-semibold admin-shell-text">Order summary</h3>
            <p className="mt-1 text-xs admin-surface-muted">{selectedTable ? `Table ${selectedTable.name}` : "No table"}</p>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
              {cart.length === 0 ? (
                <li className="admin-surface-faint">No items yet.</li>
              ) : cart.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-2 rounded-lg admin-surface-card px-2 py-2">
                  <span className="admin-surface-body">{line.qty}× {line.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ra-primary">${(line.price * line.qty).toFixed(2)}</span>
                    <button type="button" onClick={() => removeLine(line.id)}
                      className="cursor-pointer rounded-lg p-1 admin-surface-muted hover:bg-red-500/15 hover:text-red-400">
                      <Trash2 className="size-4" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t admin-shell-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="admin-surface-muted">Subtotal</span>
                <span className="font-semibold admin-shell-text">${total.toFixed(2)}</span>
              </div>
              <button type="button" disabled={!selectedTable || cart.length === 0} onClick={() => setStep(3)}
                className="cursor-pointer mt-4 w-full rounded-xl bg-ra-primary py-3 text-sm font-semibold text-zinc-950 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40">
                Continue to review
              </button>
            </div>
          </aside>
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-lg admin-surface-card p-6">
          <h2 className="text-lg font-semibold admin-shell-text">Confirm order</h2>
          <p className="mt-1 text-sm admin-surface-muted">Table {selectedTable?.name} · {cart.length} lines</p>
          <ul className="mt-4 space-y-2 text-sm admin-surface-body">
            {cart.map((line) => (
              <li key={line.id} className="flex justify-between">
                <span>{line.qty}× {line.name}</span>
                <span>${(line.price * line.qty).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex justify-between border-t admin-shell-border pt-4 admin-surface-title text-base font-semibold">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </p>
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="cursor-pointer flex-1 rounded-xl border admin-shell-border py-3 text-sm font-medium admin-shell-text hover:border-zinc-500">Back</button>
            <button type="button" onClick={placeOrder} className="cursor-pointer flex-1 rounded-xl bg-ra-primary py-3 text-sm font-semibold text-zinc-950 hover:brightness-110 active:scale-[0.98]">Place order</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-ra-primary-30 bg-ra-primary-10 py-20">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-ra-primary text-zinc-950 shadow-ra-primary-glow">
            <Check className="size-8" />
          </span>
          <p className="mt-6 text-lg font-semibold text-ra-primary-muted">Sent to kitchen</p>
          <p className="mt-2 text-sm admin-surface-muted">Resetting for next guest…</p>
        </div>
      )}
    </div>
  );
}
