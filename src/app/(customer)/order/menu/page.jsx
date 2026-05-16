"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { CUSTOMER_MENU_CONTENT, CUSTOMER_MENU_TYPE_FILTERS } from "@/config/customerMenuContent";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { ITEM_TYPE_META } from "@/types/menu";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, UtensilsCrossed, Zap, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_COLOR = { "dine-in": "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30", takeaway: "text-amber-600 bg-amber-50 border-amber-200", delivery: "text-rose-600 bg-rose-50 border-rose-200" };

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white">
      <div className="skeleton aspect-[16/10]" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton mt-3 h-9 w-full rounded-xl" />
      </div>
    </div>
  );
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    const typeParam  = searchParams.get("type");
    if (typeParam && ["dine-in", "takeaway", "delivery"].includes(typeParam)) setOrderType(typeParam);
    if (tableParam) {
      updateCustomer({ tableNumber: tableParam });
      if (!typeParam) setOrderType("dine-in");
    }
    setTimeout(() => setIsLoaded(true), 300);
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
    if (!orderType) { setOrderTypeModalOpen(true); return; }
    cart.addItem(item);
    showToast(`${item.name} added to cart`);
    setCartOpen(true);
  };

  const OrderTypeIcon = orderType ? TYPE_ICON[orderType] : null;
  const cartBar = cart.itemCount > 0;
  const hasFilters = search || activeCategory !== "all" || activeType !== "all" || fastOnly;

  return (
    <div className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${cartBar ? "pb-28 md:pb-8" : ""}`}>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 rounded-2xl border border-[#FFE4D6] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
      >
        <div>
          <h1 className="font-poppins text-xl font-bold text-[#111827] sm:text-2xl">{CUSTOMER_MENU_CONTENT.title}</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">
            <span className="font-semibold text-[#111827]">{filtered.length}</span> {CUSTOMER_MENU_CONTENT.subtitle}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {orderType ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${TYPE_COLOR[orderType]}`}
            >
              {OrderTypeIcon && <OrderTypeIcon className="size-3.5 shrink-0" />}
              {TYPE_LABEL[orderType]}
              <span className="hidden text-current/60 sm:inline">· Change</span>
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => setOrderTypeModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#FFE4D6] bg-[#FFF8F3] px-3 py-2 text-xs font-semibold text-[#111827] transition-colors hover:border-[#FF6B35]/30"
            >
              <SlidersHorizontal className="size-3.5" />
              {CUSTOMER_MENU_CONTENT.selectOrderType}
            </motion.button>
          )}
          {cartBar && (
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href={link("/order/cart")}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#FF6B35]/20"
              >
                <ShoppingCart className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">{CUSTOMER_MENU_CONTENT.cartLabel}</span>
                <span>({cart.itemCount}) · {formatCustomerMoney(cart.subtotal)}</span>
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mb-5"
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={CUSTOMER_MENU_CONTENT.searchPlaceholder}
          autoComplete="off"
          className="min-h-[48px] w-full rounded-2xl border border-[#FFE4D6] bg-white py-3 pl-11 pr-4 text-sm text-[#111827] shadow-sm outline-none transition-all placeholder:text-[#6B7280] focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/10"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#6B7280] hover:bg-[#FFF8F3] hover:text-[#111827]"
            >
              <X className="size-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Category tabs */}
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] snap-x snap-mandatory sm:mx-0 sm:px-0">
        {[{ id: "all", name: CUSTOMER_MENU_CONTENT.allCategoryLabel }, ...categories].map((c) => (
          <motion.button
            key={c.id}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={`shrink-0 snap-start rounded-full px-4 py-2 text-xs font-semibold transition-all ${
              activeCategory === c.id
                ? "gradient-primary text-white shadow-md shadow-[#FF6B35]/20"
                : "border border-[#FFE4D6] bg-white text-[#6B7280] hover:border-[#FF6B35]/30 hover:text-[#111827]"
            }`}
          >
            {c.name}
          </motion.button>
        ))}
      </div>

      {/* Type + Fast filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CUSTOMER_MENU_TYPE_FILTERS.map((t) => {
          const meta = ITEM_TYPE_META[t];
          return (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => setActiveType(t)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeType === t
                  ? t === "all"
                    ? "bg-[#111827] text-white shadow-sm"
                    : `${meta?.badge ?? ""} ring-1 ring-black/5`
                  : "border border-[#FFE4D6] bg-white text-[#6B7280] hover:border-[#FF6B35]/30 hover:text-[#111827]"
              }`}
            >
              {t !== "all" && <span className={`size-1.5 shrink-0 rounded-full ${meta?.dot}`} />}
              {t === "all" ? CUSTOMER_MENU_CONTENT.allTypesLabel : meta?.label}
            </motion.button>
          );
        })}
        <motion.button
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => setFastOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            fastOnly
              ? "bg-[#F59E0B]/15 text-[#F59E0B] ring-1 ring-[#F59E0B]/30"
              : "border border-[#FFE4D6] bg-white text-[#6B7280] hover:border-[#FF6B35]/30"
          }`}
        >
          <Zap className="size-3 shrink-0" />
          {CUSTOMER_MENU_CONTENT.fastFilterLabel}
        </motion.button>

        {/* Clear filters */}
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-semibold text-red-500 transition-all hover:bg-red-100"
            >
              <X className="size-3" /> Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      {!isLoaded ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#FFE4D6] bg-white px-6 py-16 text-center"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-[#FFF8F3]">
            <UtensilsCrossed className="size-8 text-[#FF6B35]/40" />
          </div>
          <p className="mt-4 font-poppins text-base font-semibold text-[#111827]">{CUSTOMER_MENU_CONTENT.emptyStateTitle}</p>
          <button
            type="button"
            onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
            className="mt-4 rounded-xl gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-md"
          >
            {CUSTOMER_MENU_CONTENT.clearFiltersLabel}
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((item, i) => {
            const typeMeta = ITEM_TYPE_META[item.itemType] ?? null;
            const inCart = cart.lines.find((l) => l.id === item.id);
            const isFast = (item.prepTime ?? 99) < 10;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                whileHover={{ y: -5 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-[#FF6B35]/10"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#FFF8F3] sm:aspect-[16/9]">
                  <SafeDishImage
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    iconClassName="size-14 text-[#FF6B35]/25"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  {typeMeta && (
                    <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 backdrop-blur-sm ${typeMeta.badge}`}>
                      <span className={`size-1.5 shrink-0 rounded-full ${typeMeta.dot}`} />
                      {typeMeta.label}
                    </span>
                  )}
                  {item.prepTime != null && (
                    <span className={`absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm ${
                      isFast ? "bg-[#F59E0B] text-white shadow-sm" : "bg-white/95 text-[#6B7280] ring-1 ring-black/5"
                    }`}>
                      {isFast ? <Zap className="size-2.5" /> : <Clock className="size-2.5" />}
                      {item.prepTime}m
                    </span>
                  )}
                  <span className="absolute bottom-2.5 right-2.5 rounded-xl bg-white/95 px-2.5 py-1 text-sm font-bold text-[#FF6B35] shadow-sm backdrop-blur-sm">
                    {formatCustomerMoney(item.price)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3.5 sm:p-4">
                  <h3 className="font-poppins line-clamp-1 text-sm font-semibold text-[#111827]">{item.name}</h3>
                  {item.description && (
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-[#6B7280] sm:text-xs">{item.description}</p>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => handleAdd(item)}
                    className={`mt-auto flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      inCart
                        ? "border border-[#FF6B35]/30 bg-[#FF6B35]/8 text-[#FF6B35]"
                        : "gradient-primary text-white shadow-sm shadow-[#FF6B35]/20 hover:shadow-md hover:shadow-[#FF6B35]/30"
                    }`}
                  >
                    <Plus className="size-3.5 shrink-0" />
                    {inCart ? `${CUSTOMER_MENU_CONTENT.inCartLabel} (${inCart.qty})` : CUSTOMER_MENU_CONTENT.addToCartLabel}
                  </motion.button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      {/* Mobile cart bar */}
      <AnimatePresence>
        {cartBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden"
          >
            <Link
              href={link("/order/cart")}
              className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl gradient-primary px-5 py-4 shadow-2xl shadow-[#FF6B35]/30"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">
                {cart.itemCount}
              </span>
              <span className="flex-1 text-center text-sm font-bold text-white">
                {CUSTOMER_MENU_CONTENT.viewCartLabel}
              </span>
              <span className="shrink-0 font-poppins text-sm font-bold text-white">
                {formatCustomerMoney(cart.subtotal)}
              </span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CustomerMenuPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[#FFE4D6] bg-white">
              <div className="skeleton aspect-[16/10]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton mt-3 h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <CustomerMenuPageContent />
    </Suspense>
  );
}
