"use client";

import CartItem from "@/components/pos/CartItem";
import CustomerSearch from "@/components/pos/CustomerSearch";
import TableSelector from "@/components/pos/TableSelector";
import { POS_TABLES } from "@/components/pos/mockData";
import EmptyState from "@/components/ui/EmptyState";
import { Bike, ConciergeBell, CreditCard, Store, Trash2 } from "lucide-react";

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
  // new props
  orderType, onOrderTypeChange,
  selectedTableId, onTableSelect,
  delivery, onDeliveryChange,
  onCustomerSelect,
}) {
  return (
    <aside className="flex h-full min-h-[520px] flex-col rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-lg shadow-black/20">

      {/* ── Order type tabs ── */}
      <div className="flex gap-1 border-b border-zinc-800 p-3">
        {ORDER_TYPES.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onOrderTypeChange(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
              orderType === id
                ? "bg-emerald-500 text-zinc-950"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
            aria-pressed={orderType === id}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Contextual fields ── */}
      {orderType === "dine-in" && (
        <div className="border-b border-zinc-800 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Table</p>
          <TableSelector
            tables={POS_TABLES}
            selectedTableId={selectedTableId}
            onSelect={onTableSelect}
            compact
          />
        </div>
      )}

      {orderType === "delivery" && (
        <div className="space-y-2 border-b border-zinc-800 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Delivery Details</p>
          {["name", "phone", "address"].map((field) => (
            <input
              key={field}
              value={delivery[field]}
              onChange={(e) => onDeliveryChange(field, e.target.value)}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-xs text-zinc-100 outline-none focus:border-emerald-500/40"
            />
          ))}
        </div>
      )}

      {/* ── Customer search ── */}
      <div className="border-b border-zinc-800 p-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Customer</p>
        <CustomerSearch onCustomerSelect={onCustomerSelect} />
      </div>

      {/* ── Header ── */}
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
              <CartItem
                key={line.id}
                line={line}
                onInc={onInc}
                onDec={onDec}
                onRemove={onRemove}
                onSetQuantity={onSetQuantity}
              />
            ))}
          </ul>
        )}
      </div>

      {/* ── Totals + actions ── */}
      <div className="border-t border-zinc-800 p-3 space-y-3">
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

        <button
          type="button"
          onClick={onPlaceOrder}
          disabled={!canPlaceOrder}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <CreditCard className="size-4" />
          Place Order
        </button>
        <button
          type="button"
          onClick={onClearCart}
          disabled={cart.length === 0}
          className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 py-2 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
          Clear
        </button>
      </div>
    </aside>
  );
}
