"use client";

import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { raTextareaCls } from "@/config/restaurantAdminTheme";
import { adminControl } from "@/config/adminDesignSystem";
import CartItem from "@/components/pos/CartItem";
import CustomerSearch from "@/components/pos/CustomerSearch";
import PosOrderTypeBar from "@/components/pos/PosOrderTypeBar";
import PosPaymentSection from "@/components/pos/PosPaymentSection";
import PosTableSelectField, { PosSetupHint } from "@/components/pos/PosTableSelectField";
import TablePickerModal from "@/components/pos/TablePickerModal";
import { useModuleData } from "@/context/ModuleDataContext";
import { formatAdminMoney } from "@/lib/adminCurrency";
import EmptyState from "@/components/ui/EmptyState";
import { CreditCard, Trash2 } from "lucide-react";
import PhoneInput from "@/components/ui/PhoneInput";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * @param {"all"|"setup"|"checkout"} section — which blocks to render
 * @param {"sidebar"|"drawer"|"embedded"} layout — shell styling
 */
export default function OrderSummary({
  section = "all",
  layout = "sidebar",
  cart,
  subtotal,
  taxAmount = 0,
  taxPercent = 0,
  serviceCharge = 0,
  serviceChargePercent = 0,
  total,
  currency = "INR",
  canPlaceOrder,
  onPlaceOrder,
  onClearCart,
  onInc,
  onDec,
  onRemove,
  onSetQuantity,
  onSetLineNote,
  orderType,
  onOrderTypeChange,
  paymentMethod = "cashCounter",
  onPaymentMethodChange,
  paymentStatus = "paid",
  onPaymentStatusChange,
  selectedTableId,
  onTableSelect,
  delivery,
  onDeliveryChange,
  onCustomerSelect,
  selectedCustomer,
  isPlacing = false,
  note = "",
  onNoteChange,
  fieldErrors = {},
  onClearFieldError,
  hideOrderTypes = false,
  tablePickerRequest = 0,
}) {
  const { floorTables, tableCategories } = useModuleData();
  const [pickerOpen, setPickerOpen] = useState(false);
  const prevOrderType = useRef(orderType);

  const openTablePicker = () => setPickerOpen(true);

  const showSetup = section === "all" || section === "setup";
  const showCheckout = section === "all" || section === "checkout";

  const categoryMap = useMemo(
    () => Object.fromEntries(tableCategories.map((c) => [c.id, c])),
    [tableCategories]
  );

  const selectedTable = useMemo(
    () => floorTables.find((t) => t.id === selectedTableId) ?? null,
    [floorTables, selectedTableId]
  );

  const selectedCat = selectedTable ? categoryMap[selectedTable.categoryId] : null;

  const isDesktopViewport = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1280px)").matches;

  useEffect(() => {
    if (!showSetup || layout === "drawer") return;
    if (layout === "embedded" && isDesktopViewport()) {
      prevOrderType.current = orderType;
      return;
    }
    if (
      layout === "sidebar" &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1279px)").matches
    ) {
      prevOrderType.current = orderType;
      return;
    }
    if (orderType === "dine-in" && prevOrderType.current !== "dine-in" && !selectedTableId) {
      openTablePicker();
    }
    prevOrderType.current = orderType;
  }, [orderType, selectedTableId, showSetup, layout]);

  useEffect(() => {
    if (layout !== "embedded" || !showSetup || !tablePickerRequest || orderType !== "dine-in") return;
    openTablePicker();
  }, [tablePickerRequest, orderType, showSetup, layout]);

  const shellClass =
    layout === "drawer"
      ? "flex min-h-0 flex-col"
      : layout === "embedded"
        ? "flex min-h-0 flex-col"
        : "flex max-h-full min-h-0 flex-col overflow-y-auto overscroll-contain admin-surface-card shadow-lg shadow-black/20 [scrollbar-width:thin] xl:max-h-[calc(100dvh-5.25rem)]";

  const handlePlaceOrder = () => {
    onPlaceOrder?.();
  };

  return (
    <>
      <aside className={shellClass}>
        {showSetup ? (
          <div
            className={`shrink-0 ${
              layout === "sidebar"
                ? `max-h-[min(28vh,240px)] overflow-y-auto overscroll-contain border-b ${adminShell.borderB}`
                : ""
            }`}
          >
        {showSetup && !hideOrderTypes && (
          <div className={`border-b ${adminShell.borderB} p-2 sm:p-3 xl:p-3`}>
            <PosOrderTypeBar
              orderType={orderType}
              onOrderTypeChange={onOrderTypeChange}
              onTableSelect={onTableSelect}
              onClearFieldError={onClearFieldError}
              className="border-0 bg-transparent p-0"
            />
          </div>
        )}

        {showSetup && orderType === "dine-in" && (
          <div className={`border-b ${adminShell.borderB} p-3`}>
            <PosTableSelectField
              selectedTable={selectedTable}
              areaName={selectedCat?.name}
              fieldError={fieldErrors.table}
              onOpenPicker={openTablePicker}
              onClear={() => {
                onTableSelect("");
                onClearFieldError?.("table");
              }}
            />
          </div>
        )}

        {showSetup && orderType === "delivery" && (
          <div className={`space-y-2 border-b ${adminShell.borderB} p-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Delivery details</p>
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
              {fieldErrors.deliveryName && <p className="mt-1 text-[10px] text-red-400">{fieldErrors.deliveryName}</p>}
            </div>
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

        {showSetup && orderType !== "delivery" && (
          <div className="admin-surface-divider-b p-3">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">Customer</p>
            </div>

            {orderType === "dine-in" && !selectedTableId ? (
              <PosSetupHint
                message="Select a table before adding a customer."
                actionLabel="Select table"
                onAction={openTablePicker}
              />
            ) : (
              <>
                <CustomerSearch
                  onCustomerSelect={(c) => {
                    onCustomerSelect?.(c);
                    onClearFieldError?.("customer");
                  }}
                />
                {fieldErrors.customer && (
                  <p className="mt-1.5 text-[10px] text-red-400">{fieldErrors.customer}</p>
                )}
              </>
            )}
          </div>
        )}
          </div>
        ) : null}

        {showCheckout && (
          <div
            className={`flex flex-col ${
              section === "checkout" || section === "all" || layout === "drawer" ? "min-h-0 flex-1" : ""
            } ${layout === "sidebar" ? "" : "min-h-0 overflow-hidden"}`}
          >
            <div
              className={
                layout === "sidebar"
                  ? "shrink-0"
                  : "min-h-[10rem] flex-1 overflow-y-auto overscroll-contain"
              }
            >
              <div className="shrink-0 px-4 pt-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold admin-shell-text">Order summary</h2>
                    <p className="text-[11px] admin-surface-muted">
                      {cart.length === 0
                        ? "No items yet"
                        : `${cart.length} dish${cart.length === 1 ? "" : "es"} · ${cart.reduce((s, l) => s + l.qty, 0)} pcs`}
                    </p>
                  </div>
                  {cart.length > 0 ? (
                    <span className="shrink-0 rounded-full bg-ra-primary/15 px-2.5 py-1 text-[10px] font-bold tabular-nums text-ra-primary">
                      {formatAdminMoney(subtotal, currency, { decimals: 2 })}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="px-3 pb-3">
                {cart.length === 0 ? (
                  <EmptyState title="Cart is empty" description="Tap menu items to add them." />
                ) : (
                  <ul>
                    {cart.map((line, index) => (
                      <CartItem
                        key={line.id}
                        index={index + 1}
                        line={line}
                        currency={currency}
                        compact={false}
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
            </div>

            <div className="sticky bottom-0 z-10 shrink-0 space-y-3 border-t border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.45)]">
              {cart.length > 0 && (
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">
                    Order note <span className="normal-case font-normal text-zinc-700">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => onNoteChange?.(e.target.value)}
                    placeholder="Allergies, special requests…"
                    className={`${raTextareaCls} text-xs`}
                  />
                </div>
              )}

              <div className="space-y-1 text-xs">
                <div className="flex justify-between admin-surface-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums admin-shell-text">{formatAdminMoney(subtotal, currency, { decimals: 2 })}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between admin-surface-muted">
                    <span>Tax {taxPercent > 0 ? `(${taxPercent}%)` : ""}</span>
                    <span className="tabular-nums admin-shell-text">{formatAdminMoney(taxAmount, currency, { decimals: 2 })}</span>
                  </div>
                )}
                {serviceCharge > 0 && (
                  <div className="flex justify-between admin-surface-muted">
                    <span>Service {serviceChargePercent > 0 ? `(${serviceChargePercent}%)` : ""}</span>
                    <span className="tabular-nums admin-shell-text">{formatAdminMoney(serviceCharge, currency, { decimals: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between admin-surface-divider-t pt-1.5 text-sm font-semibold admin-shell-text">
                  <span>Total</span>
                  <span className="tabular-nums">{formatAdminMoney(total, currency, { decimals: 2 })}</span>
                </div>
              </div>

              {orderType === "dine-in" && !selectedTableId && cart.length > 0 && (
                <PosSetupHint
                  message="Select a table to place this dine-in order."
                  actionLabel="Select table"
                  onAction={openTablePicker}
                />
              )}
              {orderType === "dine-in" && selectedTableId && !selectedCustomer && cart.length > 0 && (
                <PosSetupHint message="Add a customer in order details above." />
              )}
              {orderType === "takeaway" && !selectedCustomer && cart.length > 0 && (
                <PosSetupHint message="Add a customer in order details above." />
              )}
              {orderType === "delivery" &&
                cart.length > 0 &&
                !(delivery.name?.trim() && delivery.phone?.trim() && delivery.address?.trim()) && (
                  <PosSetupHint message="Complete delivery details above." />
                )}

              {cart.length > 0 && (
                <PosPaymentSection
                  orderType={orderType}
                  paymentMethod={paymentMethod}
                  paymentStatus={paymentStatus}
                  onPaymentMethodChange={onPaymentMethodChange}
                  onPaymentStatusChange={onPaymentStatusChange}
                />
              )}

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={!canPlaceOrder || isPlacing}
                className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl bg-ra-primary py-2.5 text-sm font-semibold text-zinc-950 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isPlacing ? (
                  <>
                    <span className="ra-primary-spinner size-4 animate-spin rounded-full border-2" />
                    Placing…
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" aria-hidden />
                    Place order
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClearCart}
                disabled={cart.length === 0}
                className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border admin-shell-border py-2 text-xs font-medium admin-surface-muted transition-all hover:border-zinc-500 hover:admin-shell-text disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Clear cart
              </button>
            </div>
          </div>
        )}
      </aside>

      <TablePickerModal
        open={pickerOpen}
        selectedTableId={selectedTableId}
        onSelect={(id) => {
          onTableSelect(id);
          onClearFieldError?.("table");
        }}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
