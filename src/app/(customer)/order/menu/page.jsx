"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import {
  CUSTOMER_MENU_CONTENT,
  CUSTOMER_MENU_TYPE_FILTERS,
} from "@/config/customerMenuContent";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { ITEM_TYPE_META } from "@/types/menu";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, UtensilsCrossed, Zap } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

const TYPE_ICON = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2";

function typeButtonClass(type) {
  if (type === "dine-in") return "text-emerald-800 border-emerald-500/35 bg-emerald-500/12 shadow-sm";
  if (type === "takeaway") return "text-indigo-800 border-indigo-500/35 bg-indigo-500/12 shadow-sm";
  if (type === "delivery") return "text-sky-800 border-sky-500/35 bg-sky-500/12 shadow-sm";
  return "";
}

function CustomerMenuPageContent() {
  const { cart, setOrderTypeModalOpen, orderType, setOrderType, updateCustomer, showToast, setCartOpen } = useCustomer();
  const { menuItems, categories } = useModuleData();
  const { link } = useRestaurantSlug();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [fastOnly, setFastOnly] = useState(false);

  // ✅ Auto-set order type + table number from QR URL params
  // e.g. /order/menu?table=5&type=dine-in
  useEffect(() => {
    const tableParam = searchParams.get("table");
    const typeParam  = searchParams.get("type");
    if (typeParam && ["dine-in", "takeaway", "delivery"].includes(typeParam)) {
      setOrderType(typeParam);
    }
    if (tableParam) {
      updateCustomer({ tableNumber: tableParam });
      if (!typeParam) setOrderType("dine-in"); // default to dine-in if table given
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItems = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activeItems.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
      if (activeType !== "all" && item.itemType !== activeType) return false;
      if (fastOnly && (item.prepTime ?? 99) >= 10) return false;
      if (q && !`${item.name} ${item.categoryName}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeItems, search, activeCategory, activeType, fastOnly]);

  const handleAdd = (item) => {
    if (!orderType) {
      setOrderTypeModalOpen(true);
      return;
    }
    cart.addItem(item);
    showToast(`${item.name} added to cart`);
    setCartOpen(true);
  };

  const OrderTypeIcon = orderType ? TYPE_ICON[orderType] : null;
  const cartBar = cart.itemCount > 0;

  return (
    <div
      className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${cartBar ? "pb-28 md:pb-8" : ""}`}
    >

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-100 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{CUSTOMER_MENU_CONTENT.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            <span className="font-semibold tabular-nums text-zinc-800">{filtered.length}</span>{" "}
            {CUSTOMER_MENU_CONTENT.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {orderType ? (
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className={`cursor-pointer inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${typeButtonClass(orderType)} ${focusRing}`}
            >
              {OrderTypeIcon && <OrderTypeIcon className="size-3.5 shrink-0" aria-hidden />}
              {TYPE_LABEL[orderType]}
              <span className="hidden text-zinc-500 sm:inline">· {CUSTOMER_MENU_CONTENT.changeOrderType}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className={`cursor-pointer inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-800 transition-colors hover:border-emerald-500/35 hover:bg-emerald-50/50 hover:text-emerald-800 ${focusRing}`}
            >
              {CUSTOMER_MENU_CONTENT.selectOrderType}
            </button>
          )}
          {cartBar && (
            <Link
              href={link("/order/cart")}
              className={`cursor-pointer inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md shadow-emerald-600/15 transition-colors hover:bg-emerald-400 ${focusRing}`}
            >
              <ShoppingCart className="size-3.5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{CUSTOMER_MENU_CONTENT.cartLabel}</span>
              <span className="tabular-nums">
                ({cart.itemCount}) · {formatCustomerMoney(cart.subtotal)}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <label htmlFor="menu-search" className="sr-only">
          Search menu
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-zinc-400" aria-hidden />
        <input
          id="menu-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={CUSTOMER_MENU_CONTENT.searchPlaceholder}
          autoComplete="off"
          className={`min-h-[44px] w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm text-zinc-900 shadow-sm outline-none transition-shadow placeholder:text-zinc-400 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/20 ${focusRing}`}
        />
      </div>

      {/* Category tabs */}
      <div
        className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:thin] snap-x snap-mandatory sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Menu categories"
      >
        {[{ id: "all", name: CUSTOMER_MENU_CONTENT.allCategoryLabel }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={activeCategory === c.id}
            onClick={() => setActiveCategory(c.id)}
            className={`cursor-pointer shrink-0 snap-start rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeCategory === c.id
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-600/10"
                : "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200/80 hover:bg-zinc-200/80 hover:text-zinc-900"
            } ${focusRing}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Dish type filters">
        {CUSTOMER_MENU_TYPE_FILTERS.map((t) => {
          const meta = ITEM_TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              className={`cursor-pointer inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeType === t
                  ? t === "all"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : `${meta?.badge ?? ""} ring-1 ring-black/5`
                  : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
              } ${focusRing}`}
            >
              {t !== "all" && <span className={`size-1.5 shrink-0 rounded-full ${meta?.dot}`} aria-hidden />}
              {t === "all" ? CUSTOMER_MENU_CONTENT.allTypesLabel : meta?.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setFastOnly((v) => !v)}
          aria-pressed={fastOnly}
          className={`cursor-pointer inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            fastOnly
              ? "bg-amber-100 text-amber-900 ring-1 ring-amber-300/80 shadow-sm"
              : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
          } ${focusRing}`}
        >
          <Zap className="size-3 shrink-0" aria-hidden />
          {CUSTOMER_MENU_CONTENT.fastFilterLabel}
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-zinc-400 shadow-sm ring-1 ring-zinc-100">
            <UtensilsCrossed className="size-7" aria-hidden />
          </span>
          <p className="mt-4 max-w-sm text-sm font-medium text-zinc-800">{CUSTOMER_MENU_CONTENT.emptyStateTitle}</p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setActiveCategory("all");
              setActiveType("all");
              setFastOnly(false);
            }}
            className={`mt-4 text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline ${focusRing} rounded-md px-2 py-1`}
          >
            {CUSTOMER_MENU_CONTENT.clearFiltersLabel}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const typeMeta = ITEM_TYPE_META[item.itemType] ?? null;
            const inCart = cart.lines.find((l) => l.id === item.id);
            const isFast = (item.prepTime ?? 99) < 10;
            return (
              <article
                key={item.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-100 transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300/90 hover:shadow-lg"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 sm:aspect-[16/9]">
                  <SafeDishImage
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    iconClassName="size-14 text-emerald-600/35"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/45 via-transparent to-transparent" />
                  {typeMeta && (
                    <span
                      className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 backdrop-blur-sm ${typeMeta.badge}`}
                    >
                      <span className={`size-1.5 shrink-0 rounded-full ${typeMeta.dot}`} aria-hidden />
                      {typeMeta.label}
                    </span>
                  )}
                  {item.prepTime != null && (
                    <span
                      className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                        isFast ? "bg-amber-400 text-zinc-950 shadow-sm" : "bg-white/95 text-zinc-700 ring-1 ring-zinc-200/60"
                      }`}
                    >
                      {isFast ? <Zap className="size-2.5" aria-hidden /> : <Clock className="size-2.5" aria-hidden />}
                      {item.prepTime}m
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold tabular-nums text-emerald-700 shadow-sm ring-1 ring-zinc-100 backdrop-blur-sm">
                    {formatCustomerMoney(item.price)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 sm:line-clamp-1">{item.name}</h3>
                  {item.description ? (
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-zinc-600 sm:text-xs">{item.description}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    aria-label={
                      inCart
                        ? `${CUSTOMER_MENU_CONTENT.inCartLabel}, ${inCart.qty} in cart. Add another.`
                        : `${CUSTOMER_MENU_CONTENT.addToCartLabel}: ${item.name}`
                    }
                    className={`cursor-pointer mt-auto flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98] ${
                      inCart
                        ? "bg-emerald-500/12 text-emerald-800 ring-1 ring-emerald-500/30 hover:bg-emerald-500/18"
                        : "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-600/10 hover:bg-emerald-400"
                    } ${focusRing}`}
                  >
                    <Plus className="size-3.5 shrink-0" aria-hidden />
                    {inCart ? `${CUSTOMER_MENU_CONTENT.inCartLabel} (${inCart.qty})` : CUSTOMER_MENU_CONTENT.addToCartLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Mobile cart bar */}
      {cartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <Link
            href={link("/order/cart")}
            className={`mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl bg-emerald-500 px-5 py-3.5 shadow-2xl shadow-emerald-900/20 ring-1 ring-emerald-400/30 ${focusRing}`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-inner">
              {cart.itemCount}
            </span>
            <span className="min-w-0 flex-1 truncate text-center text-sm font-bold text-zinc-950">
              {CUSTOMER_MENU_CONTENT.viewCartLabel}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-zinc-950">{formatCustomerMoney(cart.subtotal)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-zinc-500 text-sm">Loading menu…</div>}>
      <CustomerMenuPageContent />
    </Suspense>
  );
}
