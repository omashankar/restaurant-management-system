"use client";

import { adminShell } from "@/config/adminSurfaceClasses";
import { raTextareaCls } from "@/config/restaurantAdminTheme";
import CartItem from "@/components/pos/CartItem";
import PosCustomerModal from "@/components/pos/PosCustomerModal";
import PosDeliveryModal from "@/components/pos/PosDeliveryModal";
import PosDiscountModal from "@/components/pos/PosDiscountModal";
import PosOrderTypeBar from "@/components/pos/PosOrderTypeBar";
import PosPaymentSection from "@/components/pos/PosPaymentSection";
import PosSetupRow from "@/components/pos/PosSetupRow";
import { PosSetupHint } from "@/components/pos/PosTableSelectField";
import TablePickerModal from "@/components/pos/TablePickerModal";
import { useModuleData } from "@/context/ModuleDataContext";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { CreditCard, LayoutGrid, MapPin, ShoppingBag, Tag, Trash2, UserRound } from "lucide-react";
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
  discountAmount = 0,
  discountPercent = 0,
  discountMode = "percent",
  discountValue = "",
  enableDiscount = false,
  onDiscountModeChange,
  onDiscountValueChange,
  onClearDiscount,
  appliedCoupon = null,
  couponError = "",
  couponLoading = false,
  onApplyCoupon,
  onClearCoupon,
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
  const [discountOpen, setDiscountOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const prevOrderType = useRef(orderType);

  const cartQty = useMemo(() => cart.reduce((s, l) => s + l.qty, 0), [cart]);

  const deliverySummary = useMemo(() => {
    const parts = [delivery.name?.trim(), delivery.phone?.trim()].filter(Boolean);
    return parts.length ? parts.join(" · ") : null;
  }, [delivery]);

  const deliverySecondary = useMemo(() => {
    const address = delivery.address?.trim();
    if (address) return address;
    const hasName = Boolean(delivery.name?.trim());
    const hasPhone = Boolean(delivery.phone?.trim());
    if (hasName && hasPhone) return "Add delivery address";
    if (hasName || hasPhone) return "Complete name, phone & address";
    return "Name, phone & address required";
  }, [delivery]);

  const deliveryComplete = Boolean(
    delivery.name?.trim() && delivery.phone?.trim() && delivery.address?.trim()
  );

  const showFooterSetupHints = section === "checkout";

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
        : "flex min-h-0 max-h-[calc(100dvh-5.25rem)] flex-col overflow-hidden admin-surface-card shadow-lg shadow-black/20";

  const handlePlaceOrder = () => {
    onPlaceOrder?.();
  };

  return (
    <>
      <aside className={shellClass}>
        {showSetup ? (
          <div
            className={`shrink-0 space-y-2.5 p-3 ${
              layout !== "embedded" ? `border-b ${adminShell.borderB}` : "pt-2"
            }`}
          >
            {showSetup && !hideOrderTypes && (
              <PosOrderTypeBar
                orderType={orderType}
                onOrderTypeChange={onOrderTypeChange}
                onTableSelect={onTableSelect}
                onClearFieldError={onClearFieldError}
                className="border-0 bg-transparent p-0"
              />
            )}

            {layout !== "embedded" ? (
              <p className="px-0.5 text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">
                Order details
              </p>
            ) : null}

            <div className="divide-y divide-[var(--admin-border-subtle)] rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] px-3">
              {orderType === "dine-in" && (
                <PosSetupRow
                  label="Table"
                  icon={LayoutGrid}
                  primary={selectedTable ? `Table ${selectedTable.tableNumber}` : null}
                  secondary={
                    selectedTable
                      ? [selectedCat?.name, selectedTable.capacity ? `${selectedTable.capacity} seats` : null]
                          .filter(Boolean)
                          .join(" · ")
                      : "Choose area & table"
                  }
                  actionLabel={selectedTable ? "Change" : "Select"}
                  onAction={openTablePicker}
                  onClear={
                    selectedTable
                      ? () => {
                          onTableSelect("");
                          onClearFieldError?.("table");
                        }
                      : undefined
                  }
                  error={fieldErrors.table}
                />
              )}

              {orderType === "delivery" && (
                <PosSetupRow
                  label="Delivery"
                  icon={MapPin}
                  primary={deliverySummary}
                  secondary={deliverySecondary}
                  actionLabel={deliveryComplete ? "Edit" : "Add details"}
                  onAction={() => setDeliveryOpen(true)}
                  error={
                    fieldErrors.deliveryName ||
                    fieldErrors.deliveryPhone ||
                    fieldErrors.deliveryAddress ||
                    undefined
                  }
                />
              )}

              {(orderType === "takeaway" || (orderType === "dine-in" && selectedTableId)) && (
                <PosSetupRow
                  label="Customer"
                  icon={UserRound}
                  primary={selectedCustomer?.name ?? null}
                  secondary={
                    selectedCustomer
                      ? [selectedCustomer.phone, selectedCustomer.email].filter(Boolean).join(" · ")
                      : "Required before placing order"
                  }
                  actionLabel={selectedCustomer ? "Change" : "Add"}
                  onAction={() => setCustomerOpen(true)}
                  error={fieldErrors.customer}
                />
              )}
            </div>
          </div>
        ) : null}

        {showCheckout && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain [scrollbar-width:thin]">
              <div className="shrink-0 border-b admin-shell-border px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold admin-shell-text">Order summary</h2>
                    <p className="text-[11px] admin-surface-muted">
                      {cart.length === 0
                        ? "No items yet"
                        : `${cart.length} dish${cart.length === 1 ? "" : "es"} · ${cartQty} pcs`}
                    </p>
                  </div>
                  {cart.length > 0 ? (
                    <span className="shrink-0 rounded-full bg-ra-primary/15 px-2.5 py-1 text-[10px] font-bold tabular-nums text-ra-primary">
                      {formatAdminMoney(subtotal, currency, { decimals: 2 })}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 px-3 py-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed admin-shell-border px-4 py-8 text-center">
                    <ShoppingBag className="size-8 admin-surface-faint" strokeWidth={1.5} aria-hidden />
                    <p className="mt-2.5 text-sm font-medium admin-surface-muted">Cart is empty</p>
                    <p className="mt-1 max-w-[14rem] text-[11px] leading-relaxed admin-surface-faint">
                      Add items from the menu
                    </p>
                  </div>
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

            <div className="shrink-0 space-y-2.5 border-t border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] p-3">
              {cart.length > 0 ? (
                <>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider admin-surface-muted">
                      Order note{" "}
                      <span className="normal-case font-normal admin-surface-faint">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={note}
                      onChange={(e) => onNoteChange?.(e.target.value)}
                      placeholder="Allergies, special requests…"
                      className={`${raTextareaCls} text-xs`}
                    />
                  </div>

                  {enableDiscount && (
                    <button
                      type="button"
                      onClick={() => setDiscountOpen(true)}
                      className="cursor-pointer flex w-full items-center justify-between gap-2 rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] px-3 py-2 text-left transition-colors hover:border-emerald-500/30"
                    >
                      <span className="inline-flex min-w-0 items-center gap-2 text-[11px] admin-surface-muted">
                        <Tag className="size-3.5 shrink-0 text-emerald-400" aria-hidden />
                    {discountAmount > 0 ? (
                      <span className="truncate font-semibold text-emerald-400">
                        {appliedCoupon
                          ? `${appliedCoupon.code} −${formatAdminMoney(discountAmount, currency, { decimals: 2 })}`
                          : `Discount −${formatAdminMoney(discountAmount, currency, { decimals: 2 })}${
                              discountMode === "percent" && discountPercent > 0 ? ` (${discountPercent}%)` : ""
                            }`}
                      </span>
                    ) : (
                          "Add discount"
                        )}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold text-ra-primary">
                        {discountAmount > 0 ? "Edit" : "Add"}
                      </span>
                    </button>
                  )}

                  <div className="space-y-1 rounded-xl border admin-shell-border bg-[var(--admin-surface-soft)] px-3 py-2.5 text-xs">
                    <div className="flex justify-between admin-surface-muted">
                      <span>Subtotal</span>
                      <span className="tabular-nums admin-shell-text">
                        {formatAdminMoney(subtotal, currency, { decimals: 2 })}
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-400/90">
                        <span>
                          Discount
                          {discountMode === "percent" && discountPercent > 0 ? ` (${discountPercent}%)` : ""}
                        </span>
                        <span className="tabular-nums">
                          −{formatAdminMoney(discountAmount, currency, { decimals: 2 })}
                        </span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between admin-surface-muted">
                        <span>Tax {taxPercent > 0 ? `(${taxPercent}%)` : ""}</span>
                        <span className="tabular-nums admin-shell-text">
                          {formatAdminMoney(taxAmount, currency, { decimals: 2 })}
                        </span>
                      </div>
                    )}
                    {serviceCharge > 0 && (
                      <div className="flex justify-between admin-surface-muted">
                        <span>Service {serviceChargePercent > 0 ? `(${serviceChargePercent}%)` : ""}</span>
                        <span className="tabular-nums admin-shell-text">
                          {formatAdminMoney(serviceCharge, currency, { decimals: 2 })}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-[var(--admin-border-subtle)] pt-1.5 text-sm font-semibold admin-shell-text">
                      <span>Total</span>
                      <span className="tabular-nums">{formatAdminMoney(total, currency, { decimals: 2 })}</span>
                    </div>
                  </div>

                  {showFooterSetupHints && orderType === "dine-in" && !selectedTableId && (
                    <PosSetupHint
                      message="Select a table to place this dine-in order."
                      actionLabel="Select table"
                      onAction={openTablePicker}
                    />
                  )}
                  {showFooterSetupHints && orderType === "dine-in" && selectedTableId && !selectedCustomer && (
                    <PosSetupHint
                      message="Add a customer before placing the order."
                      actionLabel="Add customer"
                      onAction={() => setCustomerOpen(true)}
                    />
                  )}
                  {showFooterSetupHints && orderType === "takeaway" && !selectedCustomer && (
                    <PosSetupHint
                      message="Add a customer before placing the order."
                      actionLabel="Add customer"
                      onAction={() => setCustomerOpen(true)}
                    />
                  )}
                  {showFooterSetupHints && orderType === "delivery" && !deliveryComplete && (
                    <PosSetupHint
                      message="Complete delivery details before placing the order."
                      actionLabel="Add details"
                      onAction={() => setDeliveryOpen(true)}
                    />
                  )}

                  <PosPaymentSection
                    orderType={orderType}
                    paymentMethod={paymentMethod}
                    paymentStatus={paymentStatus}
                    onPaymentMethodChange={onPaymentMethodChange}
                    onPaymentStatusChange={onPaymentStatusChange}
                  />
                </>
              ) : (
                <p className="text-center text-[11px] admin-surface-faint">Add menu items to see totals</p>
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

      <PosDiscountModal
        open={discountOpen}
        onClose={() => setDiscountOpen(false)}
        enabled={enableDiscount}
        mode={discountMode}
        value={discountValue}
        discountAmount={discountAmount}
        currency={currency}
        subtotal={subtotal}
        appliedCoupon={appliedCoupon}
        couponError={couponError}
        couponLoading={couponLoading}
        onModeChange={onDiscountModeChange}
        onValueChange={onDiscountValueChange}
        onClear={() => {
          onClearDiscount?.();
        }}
        onApplyCoupon={onApplyCoupon}
        onClearCoupon={onClearCoupon}
      />

      <PosCustomerModal
        open={customerOpen}
        onClose={() => setCustomerOpen(false)}
        selectedCustomer={selectedCustomer}
        onCustomerSelect={onCustomerSelect}
        onClearFieldError={onClearFieldError}
      />

      <PosDeliveryModal
        open={deliveryOpen}
        onClose={() => setDeliveryOpen(false)}
        delivery={delivery}
        onDeliveryChange={onDeliveryChange}
        onClearFieldError={onClearFieldError}
        fieldErrors={fieldErrors}
      />
    </>
  );
}
