"use client";

import CartItem from "@/components/pos/CartItem";
import CustomerSearch from "@/components/pos/CustomerSearch";
import TablePickerModal from "@/components/pos/TablePickerModal";
import { useModuleData } from "@/context/ModuleDataContext";
import { getCategoryBadge } from "@/lib/tableCategoryColors";
import EmptyState from "@/components/ui/EmptyState";
import {
  Bike, Check, ConciergeBell, CreditCard,
  LayoutGrid, Store, Trash2, Users,
} from "lucide-react";
import { useMemo, useState } from "react";

const ORDER_TYPES = [
  { id: "dine-in",  label: "Dine-In",  Icon: Store },
  { id: "takeaway", label: "Takeaway", Icon: ConciergeBell },
  { id: "delivery", label: "Delivery", Icon: Bike },
];

export default function OrderSummary({
  cart,
  subtotal, tax, total,
  canPlaceOrder,
  onPlaceOrder, onClearCart,
  onInc, onDec, onRemove, onSetQuantity,
  orderType, onOrderTypeChange,
  selectedTableId, onTableSelect,
  delivery, onDeliveryChange,
  onCustomerSelect,
  selectedCustomer,
  isPlacing = false,
  note = "", onNoteChange,
}) {
  const { floorTables, tableCategories } = useModuleData();
  const [activeArea, setActiveArea] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const categoryMap = useMemo(() =>
    Object.fromEntries(tableCategories.map((c) => [c.id, c])), [tableCategories]);

  const areas = useMemo(() => {
    const ids = new Set(floorTables.map((t) => t.categoryId).filter(Boolean));
    return tableCategories.filter((c) => ids.has(c.id));
  }, [floorTables, tableCategories]);

  const currentArea = activeArea ?? areas[0]?.id ?? null;

  const tablesInArea = useMemo(() =>
    floorTables.filter((t) => t.categoryId === currentArea),
    [floorTables, currentArea]);

  const selectedTable = useMemo(() =>
    floorTables.find((t) => t.id === selectedTableId) ?? null,
    [floorTables, selectedTableId]);

  const selectedCat = selectedTable ? categoryMap[selectedTable.categoryId] : null;

  return (
    <>
      <aside className="flex h-full min-h-[520px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-lg shadow-black/20">

        {/* ── Order type tabs ── */}
        <div className="flex gap-1 border-b border-zinc-800 p-3">
          {ORDER_TYPES.map(({ id, label, Icon }) => (
            <button key={id} type="button"
              onClick={() => { onOrderTypeChange(id); onTableSelect(""); }}
              className={`cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                orderType === id
                  ? "bg-emerald-500 text-zinc-950"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
              aria-pressed={orderType === id}>
              <Icon className="size-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ══ DINE-IN: Area tabs + table grid ══ */}
        {orderType === "dine-in" && (
          <div className="border-b border-zinc-800">

            {/* Area filter pills */}
            <div className="flex gap-1.5 overflow-x-auto px-3 pt-2.5 pb-2 [scrollbar-width:none]">
              {areas.map((area) => {
                const isActive = currentArea === area.id;
                const freeCount = floorTables.filter(
                  (t) => t.categoryId === area.id && t.status === "available"
                ).length;
                return (
                  <button key={area.id} type="button"
                    onClick={() => setActiveArea(area.id)}
                    className={`cursor-pointer flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? "border-zinc-600 bg-zinc-800 text-zinc-100"
                        : "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}>
                    {area.name}
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${getCategoryBadge(area.color)}`}>
                      {freeCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table grid — scrollable, 4 cols */}
            <div className="px-3 pb-2.5 space-y-2">
              <div className="max-h-[108px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#3f3f46_transparent]">
                <div className="grid grid-cols-4 gap-1.5">
                  {tablesInArea.map((table) => {
                    const isBlocked = table.status === "occupied" || table.status === "reserved";
                    const isSelected = selectedTableId === table.id;
                    return (
                      <button key={table.id} type="button"
                        disabled={isBlocked}
                        onClick={() => !isBlocked && onTableSelect(isSelected ? "" : table.id)}
                        className={`relative flex flex-col items-start rounded-xl border px-2 py-1.5 text-left transition-all ${
                          isBlocked
                            ? "cursor-not-allowed border-zinc-800/40 bg-zinc-900/20 opacity-40"
                            : isSelected
                            ? "cursor-pointer border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/20"
                            : "cursor-pointer border-zinc-800 bg-zinc-900/50 hover:border-zinc-600"
                        }`}>
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
                            <Check className="size-2" strokeWidth={3} />
                          </span>
                        )}
                        <p className={`text-[11px] font-bold ${isSelected ? "text-emerald-300" : isBlocked ? "text-zinc-600" : "text-zinc-100"}`}>
                          {table.tableNumber}
                        </p>
                        <span className="flex items-center gap-0.5 text-[9px] text-zinc-600">
                          <Users className="size-2" />{table.capacity}
                        </span>
                        <span className={`mt-0.5 rounded px-1 py-0.5 text-[8px] font-semibold leading-none ${
                          isBlocked ? "bg-red-500/10 text-red-500"
                          : isSelected ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-500/10 text-emerald-600"
                        }`}>
                          {isBlocked ? table.status : isSelected ? "✓" : "Free"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected info row + All Areas button */}
              <div className="flex items-center justify-between">
                {selectedTable ? (
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="font-bold text-emerald-400">{selectedTable.tableNumber}</span>
                    <span className="flex items-center gap-0.5 text-zinc-500">
                      <Users className="size-2.5" />{selectedTable.capacity}
                    </span>
                    {selectedCat && <span className="text-zinc-600">· {selectedCat.name}</span>}
                    <button type="button" onClick={() => onTableSelect("")}
                      className="cursor-pointer ml-1 text-zinc-600 hover:text-red-400 transition-colors">✕</button>
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-500/70">⚠ Select a table</p>
                )}
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="cursor-pointer flex items-center gap-1 rounded-lg border border-zinc-700 px-2 py-1 text-[10px] font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
                  <LayoutGrid className="size-3" /> All Areas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delivery fields ── */}
        {orderType === "delivery" && (
          <div className="space-y-2 border-b border-zinc-800 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Delivery Details</p>
            {["name", "phone", "address"].map((field) => (
              <input key={field} value={delivery[field]}
                onChange={(e) => onDeliveryChange(field, e.target.value)}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500/40" />
            ))}
          </div>
        )}

        {/* ── Customer search — enabled only after table selected for dine-in ── */}
        <div className="border-b border-zinc-800 p-3">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Customer *</p>
            {orderType === "dine-in" && !selectedTableId && (
              <span className="text-[10px] text-zinc-600">Select table first</span>
            )}
          </div>
          <div className={orderType === "dine-in" && !selectedTableId ? "pointer-events-none opacity-40" : ""}>
            <CustomerSearch onCustomerSelect={onCustomerSelect} />
          </div>
        </div>

        {/* ── Cart header ── */}
        <div className="px-4 pt-3">
          <h2 className="text-sm font-semibold text-zinc-100">Order Summary</h2>
        </div>

        {/* ── Cart items ── */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {cart.length === 0 ? (
            <EmptyState title="Cart is empty" description="Add items from the menu." />
          ) : (
            <ul className="space-y-2">
              {cart.map((line) => (
                <CartItem key={line.id} line={line}
                  onInc={onInc} onDec={onDec} onRemove={onRemove} onSetQuantity={onSetQuantity} />
              ))}
            </ul>
          )}
        </div>

        {/* ── Totals + actions ── */}
        <div className="border-t border-zinc-800 p-3 space-y-3">

          {/* Order note */}
          {cart.length > 0 && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Order Note <span className="normal-case font-normal text-zinc-700">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => onNoteChange?.(e.target.value)}
                placeholder="Allergies, special requests…"
                className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500/40 placeholder:text-zinc-600 transition-colors"
              />
            </div>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span><span className="text-zinc-200">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Tax (8%)</span><span className="text-zinc-200">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-1.5 text-sm font-semibold text-zinc-100">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          {orderType === "dine-in" && !selectedTableId && cart.length > 0 && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              ① Select a table first
            </p>
          )}
          {orderType === "dine-in" && selectedTableId && !selectedCustomer && cart.length > 0 && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              ② Add a customer to continue
            </p>
          )}
          {orderType === "takeaway" && !selectedCustomer && cart.length > 0 && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              Add a customer to continue
            </p>
          )}

          <button type="button" onClick={onPlaceOrder} disabled={!canPlaceOrder || isPlacing}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">
            {isPlacing
              ? <><span className="size-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> Placing…</>
              : <><CreditCard className="size-4" /> Place Order</>}
          </button>
          <button type="button" onClick={onClearCart} disabled={cart.length === 0}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40">
            <Trash2 className="size-3.5" /> Clear
          </button>
        </div>
      </aside>

      {/* ── Full area-wise table picker modal ── */}
      <TablePickerModal
        open={pickerOpen}
        selectedTableId={selectedTableId}
        onSelect={onTableSelect}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
