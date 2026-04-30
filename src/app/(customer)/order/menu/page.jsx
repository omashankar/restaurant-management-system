"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import {
  CUSTOMER_MENU_CONTENT,
  CUSTOMER_MENU_TYPE_FILTERS,
} from "@/config/customerMenuContent";
import { ITEM_TYPE_META } from "@/types/menu";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, Zap } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };

function typeButtonClass(type) {
  if (type === "dine-in")  return "text-emerald-700 border-emerald-500/30 bg-emerald-500/10";
  if (type === "takeaway") return "text-indigo-700 border-indigo-500/30 bg-indigo-500/10";
  if (type === "delivery") return "text-sky-700 border-sky-500/30 bg-sky-500/10";
  return "";
}

export default function CustomerMenuPage() {
  const { cart, setOrderTypeModalOpen, orderType, showToast, setCartOpen } = useCustomer();
  const { menuItems, categories } = useModuleData();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [fastOnly, setFastOnly] = useState(false);

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
    if (!orderType) { setOrderTypeModalOpen(true); return; }
    cart.addItem(item);
    showToast(`${item.name} added to cart`);
    setCartOpen(true);
  };

  const OrderTypeIcon = orderType ? TYPE_ICON[orderType] : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white/85 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">{CUSTOMER_MENU_CONTENT.title}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {filtered.length} {CUSTOMER_MENU_CONTENT.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Order type indicator */}
          {orderType ? (
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${typeButtonClass(orderType)}`}
            >
              {OrderTypeIcon && <OrderTypeIcon className="size-3.5" />}
              {TYPE_LABEL[orderType]}
              <span className="text-zinc-500">· {CUSTOMER_MENU_CONTENT.changeOrderType}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-emerald-500/40 hover:text-emerald-700"
            >
              {CUSTOMER_MENU_CONTENT.selectOrderType}
            </button>
          )}
          {cart.itemCount > 0 && (
            <Link
              href="/order/cart"
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
            >
              <ShoppingCart className="size-3.5" />
              {CUSTOMER_MENU_CONTENT.cartLabel} ({cart.itemCount}) · ${cart.subtotal.toFixed(2)}
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={CUSTOMER_MENU_CONTENT.searchPlaceholder}
          className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/15"
        />
      </div>

      {/* Category tabs */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[{ id: "all", name: CUSTOMER_MENU_CONTENT.allCategoryLabel }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={`cursor-pointer shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              activeCategory === c.id ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 text-zinc-700 hover:text-zinc-900"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Type filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CUSTOMER_MENU_TYPE_FILTERS.map((t) => {
          const meta = ITEM_TYPE_META[t];
          return (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t)}
              className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                activeType === t
                  ? t === "all" ? "bg-zinc-200 text-zinc-900" : meta?.badge ?? ""
                  : "bg-white text-zinc-600 ring-1 ring-zinc-300 hover:text-zinc-900"
              }`}
            >
              {t !== "all" && <span className={`size-1.5 rounded-full ${meta?.dot}`} />}
              {t === "all" ? CUSTOMER_MENU_CONTENT.allTypesLabel : meta?.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setFastOnly((v) => !v)}
          className={`cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
            fastOnly ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300" : "bg-white text-zinc-600 ring-1 ring-zinc-300 hover:text-zinc-900"
          }`}
        >
          <Zap className="size-3" /> {CUSTOMER_MENU_CONTENT.fastFilterLabel}
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-zinc-600">{CUSTOMER_MENU_CONTENT.emptyStateTitle}</p>
          <button type="button" onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }} className="cursor-pointer mt-3 text-sm font-medium text-emerald-700 hover:text-emerald-800">
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
              <article key={item.id} className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-lg">
                <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent" />
                  {typeMeta && (
                    <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ring-1 backdrop-blur-sm ${typeMeta.badge}`}>
                      <span className={`size-1.5 rounded-full ${typeMeta.dot}`} />
                      {typeMeta.label}
                    </span>
                  )}
                  {item.prepTime != null && (
                    <span className={`absolute right-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold backdrop-blur-sm ${isFast ? "bg-amber-400 text-zinc-950" : "bg-white/90 text-zinc-700"}`}>
                      {isFast ? <Zap className="size-2.5" /> : <Clock className="size-2.5" />}
                      {item.prepTime}m
                    </span>
                  )}
                  <span className="absolute bottom-2 right-2 rounded-lg bg-white/90 px-2.5 py-1 text-sm font-bold text-emerald-700 backdrop-blur-sm">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-zinc-900">{item.name}</h3>
                  {item.description && <p className="line-clamp-1 text-[11px] text-zinc-600">{item.description}</p>}
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    className={`cursor-pointer mt-auto flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 ${
                      inCart
                        ? "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    }`}
                  >
                    <Plus className="size-3.5" />
                    {inCart ? `${CUSTOMER_MENU_CONTENT.inCartLabel} (${inCart.qty})` : CUSTOMER_MENU_CONTENT.addToCartLabel}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Floating cart bar on mobile */}
      {cart.itemCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 md:hidden">
          <Link
            href="/order/cart"
            className="cursor-pointer flex items-center justify-between rounded-2xl bg-emerald-500 px-5 py-3.5 shadow-2xl shadow-emerald-500/30"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600 text-xs font-bold text-white">
              {cart.itemCount}
            </span>
            <span className="text-sm font-bold text-zinc-950">{CUSTOMER_MENU_CONTENT.viewCartLabel}</span>
            <span className="text-sm font-bold text-zinc-950">${cart.subtotal.toFixed(2)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
