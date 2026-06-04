"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { adminControl } from "@/config/adminDesignSystem";
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
import PhoneInput from "@/components/ui/PhoneInput";
import { useMemo, useState } from "react";

const ORDER_TYPES = [
  { id: "dine-in",  label: "Dine-In",  Icon: Store },
  { id: "takeaway", label: "Takeaway", Icon: ConciergeBell },
  { id: "delivery", label: "Delivery", Icon: Bike },
];

const POS_PAYMENT_METHODS = [
  { id: "cashCounter", label: "Cash" },
  { id: "upi",         label: "UPI" },
  { id: "card",        label: "Card" },
  { id: "cod",         label: "COD" },
];

export default function OrderSummary({
  cart,
  subtotal,
  taxAmount = 0, taxPercent = 0,
  serviceCharge = 0, serviceChargePercent = 0,
  total,
  currency = "INR",
  canPlaceOrder,
  onPlaceOrder, onClearCart,
  onInc, onDec, onRemove, onSetQuantity, onSetLineNote,
  orderType, onOrderTypeChange,
  paymentMethod = "cashCounter", onPaymentMethodChange,
  paymentStatus = "paid", onPaymentStatusChange,
  selectedTableId, onTableSelect,
  delivery, onDeliveryChange,
  onCustomerSelect,
  selectedCustomer,
  isPlacing = false,
  note = "", onNoteChange,
  fieldErrors = {},
  onClearFieldError,
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
      <aside className="flex h-full min-h-[520px] flex-col admin-surface-card shadow-lg shadow-black/20">

        {/* ── Order type tabs ── */}
        <div className={`flex gap-1 border-b ${adminShell.borderB} p-3`}>
          {ORDER_TYPES.map(({ id, label, Icon }) => (
            <button key={id} type="button"
              onClick={() => {
                onOrderTypeChange(id);
                onTableSelect("");
                onClearFieldError?.("table");
                onClearFieldError?.("customer");
                onClearFieldError?.("deliveryName");
                onClearFieldError?.("deliveryPhone");
                onClearFieldError?.("deliveryAddress");
              }}
              className={`cursor-pointer flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                orderType === id
                  ? "bg-ra-primary text-zinc-950"
                  : `${adminSurface.muted} hover:bg-[var(--admin-hover)] hover:admin-shell-text`
              }`}
              aria-pressed={orderType === id}>
              <Icon className="size-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ══ DINE-IN: Area tabs + table grid ══ */}
        {orderType === "dine-in" && (
          <div className={`border-b ${adminShell.borderB}`}>

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
                        ? "border-[var(--admin-border)] bg-[var(--admin-hover-strong)] admin-shell-text"
                        : `border-[var(--admin-border-subtle)] ${adminSurface.muted} hover:border-[var(--admin-border)] hover:admin-surface-body`
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
                        onClick={() => {
                          if (!isBlocked) {
                            onTableSelect(isSelected ? "" : table.id);
                            onClearFieldError?.("table");
                          }
                        }}
                        className={`relative flex flex-col items-start rounded-xl border px-2 py-1.5 text-left transition-all ${
                          isBlocked
                            ? "cursor-not-allowed admin-shell-border/40 bg-zinc-900/20 opacity-40"
                            : isSelected
                            ? "cursor-pointer border-ra-primary-50 bg-ra-primary-10 ring-1 ring-ra-primary-20"
                            : "cursor-pointer border-[var(--admin-border)] bg-[var(--admin-hover)] hover:border-[var(--admin-border)]"
                        }`}>
                        {isSelected && (
                          <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-ra-primary text-zinc-950">
                            <Check className="size-2" strokeWidth={3} />
                          </span>
                        )}
                        <p className={`text-[11px] font-bold ${isSelected ? "text-ra-primary-muted" : isBlocked ? "admin-surface-faint" : "admin-shell-text"}`}>
                          {table.tableNumber}
                        </p>
                        <span className="flex items-center gap-0.5 text-[9px] admin-surface-faint">
                          <Users className="size-2" />{table.capacity}
                        </span>
                        <span className={`mt-0.5 rounded px-1 py-0.5 text-[8px] font-semibold leading-none ${
                          isBlocked ? "bg-red-500/10 text-red-500"
                          : isSelected ? "bg-ra-primary/20 text-ra-primary"
                          : "bg-ra-primary-10 text-ra-accent"
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
                    <span className="font-bold text-ra-primary">{selectedTable.tableNumber}</span>
                    <span className="flex items-center gap-0.5 admin-surface-muted">
                      <Users className="size-2.5" />{selectedTable.capacity}
                    </span>
                    {selectedCat && <span className="admin-surface-faint">· {selectedCat.name}</span>}
                    <button type="button" onClick={() => onTableSelect("")}
                      className="cursor-pointer ml-1 admin-surface-faint hover:text-red-400 transition-colors">✕</button>
                  </div>
                ) : (
                  <p className={`text-[10px] ${fieldErrors.table ? "text-red-400" : "text-amber-500/70"}`}>
                    {fieldErrors.table || "⚠ Select a table"}
                  </p>
                )}
                <button type="button" onClick={() => setPickerOpen(true)}
                  className={`cursor-pointer flex items-center gap-1 rounded-lg border admin-shell-border px-2 py-1 text-[10px] font-medium ${adminSurface.muted} hover:border-[var(--admin-border)] hover:admin-shell-text transition-colors`}>
                  <LayoutGrid className="size-3" /> All Areas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delivery fields ── */}
        {orderType === "delivery" && (
          <div className={`space-y-2 border-b ${adminShell.borderB} p-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Delivery Details *</p>
            <p className="text-[10px] admin-surface-faint">Name, phone & address — customer auto-saved on place order</p>
            <div>
              <input
                value={delivery.name}
                onChange={(e) => {
                  onDeliveryChange("name", e.target.value);
                  onClearFieldError?.("deliveryName");
                }}
                placeholder="Name *"
                aria-invalid={fieldErrors.deliveryName ? true : undefined}
                className={`${adminControl.input} w-full px-3 py-2 text-xs focus-ra-primary`}
              />
              {fieldErrors.deliveryName && (
                <p className="mt-1 text-[10px] text-red-400">{fieldErrors.deliveryName}</p>
              )}
            </div>
            <div>
              <PhoneInput
                id="pos-delivery-phone"
                value={delivery.phone}
                size="sm"
                onChange={(digits) => {
                  onDeliveryChange("phone", digits);
                  onClearFieldError?.("deliveryPhone");
                }}
                error={fieldErrors.deliveryPhone || undefined}
              />
            </div>
            <div>
              <input
                value={delivery.address}
                onChange={(e) => {
                  onDeliveryChange("address", e.target.value);
                  onClearFieldError?.("deliveryAddress");
                }}
                placeholder="Full delivery address *"
                maxLength={300}
                aria-invalid={fieldErrors.deliveryAddress ? true : undefined}
                className={`${adminControl.input} w-full px-3 py-2 text-xs focus-ra-primary`}
              />
              {fieldErrors.deliveryAddress && (
                <p className="mt-1 text-[10px] text-red-400">{fieldErrors.deliveryAddress}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Customer search (dine-in / takeaway only) ── */}
        {orderType !== "delivery" && (
          <div className="border-b admin-shell-border p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Customer *</p>
              {orderType === "dine-in" && !selectedTableId && (
                <span className="text-[10px] admin-surface-faint">Select table first</span>
              )}
            </div>
            <div className={orderType === "dine-in" && !selectedTableId ? "pointer-events-none opacity-40" : ""}>
              <CustomerSearch
                onCustomerSelect={(c) => {
                  onCustomerSelect?.(c);
                  onClearFieldError?.("customer");
                }}
              />
            </div>
            {fieldErrors.customer && (
              <p className="mt-1.5 text-[10px] text-red-400">{fieldErrors.customer}</p>
            )}
          </div>
        )}

        {/* ── Cart header ── */}
        <div className="px-4 pt-3">
          <h2 className="text-sm font-semibold admin-shell-text">Order Summary</h2>
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
                  currency={currency}
                  onInc={onInc}
                  onDec={onDec}
                  onRemove={onRemove}
                  onSetQuantity={onSetQuantity}
                  onSetLineNote={onSetLineNote}
                />
              ))}
            </ul>
          )}
        </div>

        {/* ── Totals + actions ── */}
        <div className="border-t admin-shell-border p-3 space-y-3">

          {/* Order note */}
          {cart.length > 0 && (
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">
                Order Note <span className="normal-case font-normal text-zinc-700">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => onNoteChange?.(e.target.value)}
                placeholder="Allergies, special requests…"
                className="w-full resize-none rounded-xl border admin-shell-border admin-surface-card px-3 py-2 text-xs admin-shell-text outline-none focus-ra-primary placeholder:admin-surface-faint transition-colors"
              />
            </div>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between admin-surface-muted">
              <span>Subtotal</span>
              <span className="admin-shell-text">{currency} {subtotal.toFixed(2)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between admin-surface-muted">
                <span>Tax {taxPercent > 0 ? `(${taxPercent}%)` : ""}</span>
                <span className="admin-shell-text">{currency} {taxAmount.toFixed(2)}</span>
              </div>
            )}
            {serviceCharge > 0 && (
              <div className="flex justify-between admin-surface-muted">
                <span>Service Charge {serviceChargePercent > 0 ? `(${serviceChargePercent}%)` : ""}</span>
                <span className="admin-shell-text">{currency} {serviceCharge.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t admin-shell-border pt-1.5 text-sm font-semibold admin-shell-text">
              <span>Total</span>
              <span>{currency} {total.toFixed(2)}</span>
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
          {orderType === "delivery" && cart.length > 0 && !(delivery.name?.trim() && delivery.phone?.trim() && delivery.address?.trim()) && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-400">
              Fill delivery name, phone & address
            </p>
          )}

          {cart.length > 0 && (
            <div className="space-y-2 rounded-xl admin-surface-card p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Payment</p>
              <div className="flex flex-wrap gap-1">
                {POS_PAYMENT_METHODS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onPaymentMethodChange?.(id)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                      paymentMethod === id
                        ? "bg-ra-primary/20 text-ra-primary-muted ring-1 ring-ra-primary-25"
                        : "admin-surface-muted hover:bg-[var(--admin-hover)] hover:admin-surface-body"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {[
                  { id: "paid", label: "Paid" },
                  { id: "pending", label: "Pending" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onPaymentStatusChange?.(id)}
                    className={`cursor-pointer flex-1 rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                      paymentStatus === id
                        ? id === "paid"
                          ? "bg-ra-primary text-zinc-950"
                          : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/30"
                        : "bg-zinc-900 admin-surface-muted hover:admin-surface-body"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={onPlaceOrder} disabled={!canPlaceOrder || isPlacing}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            {isPlacing
              ? <><span className="size-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" /> Placing…</>
              : <><CreditCard className="size-4" /> Place Order</>}
          </button>
          <button type="button" onClick={onClearCart} disabled={cart.length === 0}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border admin-shell-border py-2 text-xs font-medium admin-surface-muted transition-all hover:border-zinc-500 hover:admin-shell-text disabled:opacity-40">
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
