"use client";

import MenuCard from "@/components/menu/MenuCard";
import MenuItemSizePickerModal from "@/components/menu/MenuItemSizePickerModal";
import OrderSummary from "@/components/pos/OrderSummary";
import PosCheckoutDrawer from "@/components/pos/PosCheckoutDrawer";
import PosMenuFilters from "@/components/pos/PosMenuFilters";
import PosMobileSetupCard, { PosMobileCartBar } from "@/components/pos/PosMobileCartBar";
import PosOrderTypeBar from "@/components/pos/PosOrderTypeBar";
import PosPageHeader, { PosFlowSteps } from "@/components/pos/PosPageHeader";
import PrintInvoice from "@/components/pos/PrintInvoice";
import { triggerPosAutoPrint } from "@/lib/posPrint";
import Modal from "@/components/ui/Modal";
import { useMenuFilter } from "@/hooks/useMenuFilter";
import { useAdminLocale } from "@/context/RestaurantLocaleContext";
import { useModuleData } from "@/context/ModuleDataContext";
import {
  EMPTY_POS_ORDER_ERRORS,
  getPosOrderFieldErrors,
} from "@/lib/formValidation";
import { resolveCustomerByPhone } from "@/lib/posCustomer";
import { getPosPaymentDefaults, resolvePosPaymentStatus } from "@/lib/posPayment";
import {
  buildSimpleCartLine,
  buildSizedCartLine,
  itemHasSizes,
} from "@/lib/menuItemSizes";
import { formatAdminMoney } from "@/lib/adminCurrency";
import { calculatePosTotals, resolvePosDiscountInput } from "@/lib/posTotals";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const KITCHEN_LABELS = {
  default_kitchen: "Default Kitchen",
  veg_kitchen: "Veg Kitchen",
  non_veg_kitchen: "Non-Veg Kitchen",
};

function PosPageContent() {
  const { formatTime, prefs } = useAdminLocale();
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
  const [paymentMethod, setPaymentMethod] = useState(() => getPosPaymentDefaults("dine-in").paymentMethod);
  const [paymentStatus, setPaymentStatus] = useState(() => getPosPaymentDefaults("dine-in").paymentStatus);
  const [selectedTableId, setSelectedTableId] = useState("");
  const [delivery, setDelivery] = useState({ name: "", phone: "", address: "" });
  const [cart, setCart] = useState([]);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAddedId, setLastAddedId] = useState("");
  const [sizePickerItem, setSizePickerItem] = useState(null);
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
  const [enableDiscount, setEnableDiscount]             = useState(false);
  const [discountMode, setDiscountMode]                 = useState("percent");
  const [discountValue, setDiscountValue]               = useState("");
  const [appliedCoupon, setAppliedCoupon]             = useState(null);
  const [couponError, setCouponError]                   = useState("");
  const [couponLoading, setCouponLoading]               = useState(false);
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
          setEnableDiscount(Boolean(d.settings?.pos?.enableDiscount));
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

  const subtotal = useMemo(() => cart.reduce((s, l) => s + l.price * l.qty, 0), [cart]);

  const discountInput = useMemo(() => {
    if (appliedCoupon?.posDiscount) {
      return appliedCoupon.posDiscount;
    }
    return resolvePosDiscountInput(enableDiscount, discountMode, discountValue);
  }, [appliedCoupon, enableDiscount, discountMode, discountValue]);

  const totals = useMemo(
    () =>
      calculatePosTotals({
        subtotal,
        taxPercent,
        serviceChargePercent,
        discountType: discountInput.discountType,
        discountPercent: discountInput.discountPercent,
        discountFixed: discountInput.discountFixed,
        roundOffTotal,
      }),
    [subtotal, taxPercent, serviceChargePercent, discountInput, roundOffTotal]
  );

  const {
    discountAmount,
    taxAmount,
    serviceCharge,
    total,
  } = totals;

  const clearCart = useCallback(() => {
    setCart([]);
    setDiscountValue("");
    setAppliedCoupon(null);
    setCouponError("");
  }, []);

  const clearCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError("");
  }, []);

  const applyPosCoupon = useCallback(
    async (code) => {
      if (!code || subtotal <= 0) return;
      setCouponLoading(true);
      setCouponError("");
      try {
        const res = await fetch("/api/coupons/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            subtotal,
            channel: "pos",
            orderType,
            paymentMethod,
            items: cart.map((l) => ({ id: l.menuItemId ?? l.id, qty: l.qty })),
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) {
          setCouponError(data?.error ?? "Invalid coupon.");
          setAppliedCoupon(null);
          return;
        }
        setDiscountValue("");
        setAppliedCoupon({
          code: data.coupon.code,
          label: data.coupon.label,
          posDiscount: data.posDiscount,
        });
      } catch {
        setCouponError("Could not validate coupon.");
        setAppliedCoupon(null);
      } finally {
        setCouponLoading(false);
      }
    },
    [subtotal, orderType, paymentMethod, cart],
  );

  const [fieldErrors, setFieldErrors] = useState(EMPTY_POS_ORDER_ERRORS);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [note, setNote] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(true);
  const [tablePickerRequest, setTablePickerRequest] = useState(0);

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

  const setupReady = posOrderValidation.valid;
  const canPlaceOrder = cart.length > 0 && setupReady;
  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  const openSetup = useCallback(() => {
    setSetupOpen(true);
    requestAnimationFrame(() => {
      document.getElementById("pos-setup")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    if (orderType === "dine-in" && !selectedTableId) {
      setTablePickerRequest((n) => n + 1);
    }
  }, [orderType, selectedTableId]);

  const addItem = (line) => {
    setCart((prev) => {
      const idx = prev.findIndex((l) => l.id === line.id);
      if (idx === -1) return [...prev, { ...line, qty: 1, note: "" }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
      return next;
    });
    setLastAddedId(line.id);
    setTimeout(() => setLastAddedId(""), 300);

    const setup = getPosOrderFieldErrors({
      orderType,
      selectedTableId,
      selectedCustomer,
      delivery,
    });
    if (
      !setup.valid &&
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1279px)").matches
    ) {
      setSetupOpen(true);
      if (orderType === "dine-in" && !selectedTableId) {
        setTablePickerRequest((n) => n + 1);
      }
      setTimeout(() => {
        document.getElementById("pos-setup")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    }
  };

  const handlePosMenuAdd = (item) => {
    if (itemHasSizes(item)) {
      setSizePickerItem(item);
      return;
    }
    addItem(buildSimpleCartLine(item));
  };

  const incrementQty = (id) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: l.qty + 1 } : l));
  const decrementQty = (id) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: Math.max(1, l.qty - 1) } : l).filter((l) => l.qty > 0));
  const removeLine   = (id) => setCart((p) => p.filter((l) => l.id !== id));
  const setLineQty   = (id, v) => setCart((p) => p.map((l) => l.id === id ? { ...l, qty: Math.max(1, parseInt(v, 10) || 1) } : l));

  const handlePaymentMethodChange = useCallback(
    (method) => {
      setPaymentMethod(method);
      setPaymentStatus(resolvePosPaymentStatus(method, orderType));
    },
    [orderType]
  );

  useEffect(() => {
    if (setupReady && cartItemCount > 0) setSetupOpen(false);
  }, [setupReady, cartItemCount]);

  const clearFieldError = useCallback((key) => {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: "" } : prev));
  }, []);

  const handleOrderTypeChange = useCallback((type) => {
    setOrderType(type);
    setSelectedTableId("");
    setFieldErrors(EMPTY_POS_ORDER_ERRORS);
    setPlaceError("");
    setSetupOpen(true);
    if (type === "delivery") setSelectedCustomer(null);
    const payment = getPosPaymentDefaults(type);
    setPaymentMethod(payment.paymentMethod);
    setPaymentStatus(payment.paymentStatus);
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
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 1279px)").matches) {
        setCheckoutOpen(false);
        openSetup();
      }
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
            menuItemId: l.menuItemId ?? l.id,
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
          discountType: discountInput.discountType,
          discountPercent: discountInput.discountPercent,
          discountFixed: discountInput.discountFixed,
          couponCode: appliedCoupon?.code ?? undefined,
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
      const saved = data.order ?? {};
      const finalSubtotal = saved.subtotal ?? subtotal;
      const finalDiscountAmount = saved.discountAmount ?? discountAmount;
      const finalDiscountPercent = saved.discountPercent ?? totals.discountPercent;
      const finalTaxAmount = saved.taxAmount ?? taxAmount;
      const finalTaxPercent = saved.taxPercent ?? taxPercent;
      const finalServiceCharge = saved.serviceCharge ?? serviceCharge;
      const finalServiceChargePercent = saved.serviceChargePercent ?? serviceChargePercent;
      const finalTotal = saved.total ?? total;

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
        total:     finalTotal,
        amount:    finalTotal,
        subtotal:  finalSubtotal,
        discountAmount: finalDiscountAmount,
        discountPercent: finalDiscountPercent,
        taxAmount: finalTaxAmount,
        taxPercent: finalTaxPercent,
        serviceCharge: finalServiceCharge,
        serviceChargePercent: finalServiceChargePercent,
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
        placedAt:   formatTime(now),
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
          { id: orderId, date: visitDate, total: finalTotal, items: itemsSummary },
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
      setCheckoutOpen(false);
      setLastOrder({
        orderId,
        orderType,
        tableNumber,
        customer: customerName,
        phone: selectedCustomer?.phone ?? delivery.phone ?? "",
        items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        subtotal: finalSubtotal,
        discountAmount: finalDiscountAmount,
        discountPercent: finalDiscountPercent,
        taxAmount: finalTaxAmount,
        taxPercent: finalTaxPercent,
        serviceCharge: finalServiceCharge,
        serviceChargePercent: finalServiceChargePercent,
        total: finalTotal,
        currency,
      });

      triggerPosAutoPrint({
        printers,
        restaurantName,
        localePrefs: prefs,
        lastOrder: {
          orderId,
          orderType,
          tableNumber,
          customer: customerName,
          items: cart.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
          subtotal: finalSubtotal,
          discountAmount: finalDiscountAmount,
          discountPercent: finalDiscountPercent,
          taxAmount: finalTaxAmount,
          taxPercent: finalTaxPercent,
          serviceCharge: finalServiceCharge,
          serviceChargePercent: finalServiceChargePercent,
          total: finalTotal,
          currency,
        },
        kitchenRouting: map,
      });

      setCart([]);
      setDiscountValue("");
      setNote("");
      setSelectedTableId("");
      setDelivery({ name: "", phone: "", address: "" });
      setSelectedCustomer(null);
      setFieldErrors(EMPTY_POS_ORDER_ERRORS);
      const payment = getPosPaymentDefaults(orderType);
      setPaymentMethod(payment.paymentMethod);
      setPaymentStatus(payment.paymentStatus);
    } catch {
      setPlaceError("Network error. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  }, [canPlaceOrder, isPlacing, cart, orderType, selectedTableId, selectedCustomer, delivery, total, subtotal,
      discountAmount, discountInput, totals, taxAmount, taxPercent, serviceCharge, serviceChargePercent, currency, note, paymentMethod, paymentStatus, appliedCoupon,
      customerRows, floorTables, setOrderRows, setKitchenQueue, setCustomerRows, setFloorTables, printers, restaurantName, openSetup]);

  useEffect(() => {
    const h = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "1") handleOrderTypeChange("dine-in");
      if (e.key === "2") handleOrderTypeChange("takeaway");
      if (e.key === "3") handleOrderTypeChange("delivery");
      if (e.key === "/") {
        e.preventDefault();
        document.querySelector("[data-pos-menu-search]")?.focus();
      }
      if (e.key === "Escape") clearCart();
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); placeOrder(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [placeOrder, handleOrderTypeChange, clearCart]);

  const setupSummary = useMemo(() => {
    if (orderType === "dine-in") {
      const table = floorTables.find((t) => t.id === selectedTableId);
      const parts = [];
      if (table?.tableNumber) parts.push(`Table ${table.tableNumber}`);
      if (selectedCustomer?.name) parts.push(selectedCustomer.name);
      return parts.length ? parts.join(" · ") : "Select table & customer";
    }
    if (orderType === "takeaway") {
      return selectedCustomer?.name ?? "Add customer";
    }
    if (delivery.name?.trim() || delivery.phone?.trim()) {
      return [delivery.name?.trim(), delivery.phone?.trim()].filter(Boolean).join(" · ");
    }
    return "Enter delivery details";
  }, [orderType, floorTables, selectedTableId, selectedCustomer, delivery]);

  const orderSummaryProps = {
    cart,
    subtotal,
    taxAmount,
    taxPercent,
    serviceCharge,
    serviceChargePercent,
    discountAmount,
    discountPercent: totals.discountPercent,
    discountMode,
    discountValue,
    enableDiscount,
    onDiscountModeChange: setDiscountMode,
    onDiscountValueChange: setDiscountValue,
    onClearDiscount: () => {
      setDiscountValue("");
      setAppliedCoupon(null);
      setCouponError("");
    },
    appliedCoupon,
    couponError,
    couponLoading,
    onApplyCoupon: applyPosCoupon,
    onClearCoupon: clearCoupon,
    total,
    currency,
    canPlaceOrder: canPlaceOrder && !isPlacing,
    onPlaceOrder: placeOrder,
    onClearCart: clearCart,
    onInc: incrementQty,
    onDec: decrementQty,
    onRemove: removeLine,
    onSetQuantity: setLineQty,
    onSetLineNote: setLineNote,
    orderType,
    onOrderTypeChange: handleOrderTypeChange,
    paymentMethod,
    onPaymentMethodChange: handlePaymentMethodChange,
    paymentStatus,
    onPaymentStatusChange: setPaymentStatus,
    selectedTableId,
    onTableSelect: setSelectedTableId,
    delivery,
    onDeliveryChange: (f, v) => setDelivery((p) => ({ ...p, [f]: v })),
    onCustomerSelect: setSelectedCustomer,
    selectedCustomer,
    isPlacing,
    note,
    onNoteChange: setNote,
    fieldErrors,
    onClearFieldError: clearFieldError,
    hideOrderTypes: true,
  };

  return (
    <div className={`min-w-0 w-full max-w-full space-y-4 overflow-x-hidden ${cartItemCount > 0 && !checkoutOpen ? "pb-24 xl:pb-0" : ""}`}>
      <div className="sticky top-0 z-20 -mx-4 min-w-0 max-w-[100vw] space-y-3 overflow-x-hidden border-b admin-shell-border bg-[var(--admin-bg)]/95 px-4 pb-3 backdrop-blur-md sm:-mx-6 sm:max-w-none sm:px-6 xl:static xl:z-auto xl:mx-0 xl:border-0 xl:bg-transparent xl:px-0 xl:pb-0 xl:backdrop-blur-none">
        <PosPageHeader
          cartItemCount={cartItemCount}
          total={total}
          currency={currency}
          setupReady={setupReady}
          onClearCart={clearCart}
        />

        <PosFlowSteps setupReady={setupReady} cartItemCount={cartItemCount} />

        <PosOrderTypeBar
          className="xl:hidden"
          orderType={orderType}
          onOrderTypeChange={handleOrderTypeChange}
          onTableSelect={setSelectedTableId}
          onClearFieldError={clearFieldError}
        />

        <PosMobileSetupCard
          summary={setupSummary}
          ready={setupReady}
          open={setupOpen}
          onOpenChange={setSetupOpen}
        >
          <OrderSummary {...orderSummaryProps} section="setup" layout="embedded" tablePickerRequest={tablePickerRequest} />
        </PosMobileSetupCard>
      </div>

      {placeError && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400 xl:hidden">
          {placeError}
        </div>
      )}

      <div className="grid min-w-0 w-full max-w-full gap-6 xl:grid-cols-10">
        <section className="min-w-0 space-y-4 xl:col-span-7">
          <PosMenuFilters
            categories={posCategories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            availableItemTypes={availableItemTypes}
            activeItemType={activeItemType}
            onItemTypeChange={setActiveItemType}
            fastOnly={fastOnly}
            onFastOnlyChange={setFastOnly}
            search={search}
            onSearchChange={setSearch}
            itemCount={filteredItems.length}
          />
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                variant="pos"
                item={item}
                currency={currency}
                onAdd={handlePosMenuAdd}
                isPopping={lastAddedId === item.id || lastAddedId.startsWith(`${item.id}::`)}
              />
            ))}
            {filteredItems.length === 0 && (
              <p className="col-span-full py-12 text-center text-sm admin-surface-faint">
                No items match the current filters.
              </p>
            )}
          </div>
        </section>

        <section
          id="pos-order-summary"
          className="hidden min-w-0 scroll-mt-4 xl:col-span-3 xl:block xl:sticky xl:top-4 xl:self-start"
        >
          {placeError && (
            <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {placeError}
            </div>
          )}
          <OrderSummary {...orderSummaryProps} section="all" layout="sidebar" hideOrderTypes={false} />
        </section>
      </div>

      <PosMobileCartBar
        itemCount={cartItemCount}
        total={total}
        currency={currency}
        setupReady={setupReady}
        onOpenSetup={openSetup}
        onOpenCheckout={() => setCheckoutOpen(true)}
        hidden={checkoutOpen}
      />

      <PosCheckoutDrawer
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        itemCount={cartItemCount}
        total={total}
        currency={currency}
      >
        {placeError && (
          <div className="mx-4 mt-3 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {placeError}
          </div>
        )}
        <OrderSummary {...orderSummaryProps} section="checkout" layout="drawer" />
      </PosCheckoutDrawer>

      <MenuItemSizePickerModal
        open={Boolean(sizePickerItem)}
        item={sizePickerItem}
        onClose={() => setSizePickerItem(null)}
        onSelect={(size) => {
          if (!sizePickerItem) return;
          addItem(buildSizedCartLine(sizePickerItem, size));
        }}
        formatMoney={(amount) => formatAdminMoney(amount, currency, { decimals: 2 })}
        tone="admin"
      />

      {/* ── Success modal ── */}
      <Modal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        title="Order Placed"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {lastOrder && (
              <PrintInvoice
                orderId={lastOrder.orderId}
                orderType={lastOrder.orderType}
                tableNumber={lastOrder.tableNumber}
                customer={lastOrder.customer}
                items={lastOrder.items}
                subtotal={lastOrder.subtotal}
                discountAmount={lastOrder.discountAmount}
                discountPercent={lastOrder.discountPercent}
                taxAmount={lastOrder.taxAmount}
                taxPercent={lastOrder.taxPercent}
                serviceCharge={lastOrder.serviceCharge}
                serviceChargePercent={lastOrder.serviceChargePercent}
                total={lastOrder.total}
                currency={lastOrder.currency}
                restaurantName={restaurantName}
                paperSize={printers.find((p) => p.printInvoice)?.paperSize ?? "80mm"}
                className="w-full sm:w-auto"
              />
            )}
            <button type="button" onClick={() => setSuccessOpen(false)} className="w-full cursor-pointer rounded-xl bg-ra-primary px-4 py-2 text-sm font-semibold text-zinc-950 hover:brightness-110 sm:w-auto">
              New Order
            </button>
          </div>
        }
      >
        <div className="min-w-0 space-y-3">
          {lastOrder?.customer && (
            <div className="rounded-xl border border-ra-primary-25 bg-ra-primary-5 px-3 py-2">
              <p className="text-[10px] admin-surface-faint">Customer</p>
              <p className="break-words text-sm font-semibold text-ra-primary-muted">
                {lastOrder.customer}{lastOrder.phone ? ` · ${lastOrder.phone}` : ""}
              </p>
            </div>
          )}
          <p className="text-sm admin-surface-muted">Kitchen tickets dispatched:</p>
          {Object.entries(kitchenRouting).map(([k, items]) => (
            <div key={k} className="min-w-0 admin-surface-card p-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{KITCHEN_LABELS[k] ?? k}</p>
              <ul className="space-y-1">
                {items.map((it, i) => (
                  <li key={i} className="min-w-0 text-sm admin-surface-body">
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 break-words">{it.name}</span>
                      <span className="shrink-0 tabular-nums text-zinc-500">×{it.qty}</span>
                    </div>
                    {it.note && (
                      <p className="mt-0.5 break-words text-[11px] text-amber-400/90">↳ {it.note}</p>
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
        <div className="flex min-h-[50vh] min-w-0 w-full max-w-full items-center justify-center overflow-x-hidden text-sm admin-surface-muted">
          Loading POS…
        </div>
      }
    >
      <PosPageContent />
    </Suspense>
  );
}
