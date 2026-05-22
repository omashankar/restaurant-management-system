"use client";

import SafeDishImage from "@/components/customer/SafeDishImage";
import FoodTypeIndicator from "@/components/customer/FoodTypeIndicator";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { CUSTOMER_MENU_CONTENT } from "@/config/customerMenuContent";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { ITEM_TYPE_META } from "@/types/menu";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, UtensilsCrossed, Zap, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_COLOR = {
  "dine-in": "text-[#FF6B35] bg-[#FF6B35]/10 border-[#FF6B35]/30",
  takeaway:  "text-amber-600 bg-amber-50 border-amber-200",
  delivery:  "text-rose-600 bg-rose-50 border-rose-200",
};

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="skeleton aspect-[16/11]" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-full rounded-full" />
        <div className="skeleton mt-3 h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

function CustomerMenuPageContent() {
  const { cart, setOrderTypeModalOpen, orderType, setOrderType, updateCustomer, showToast, setCartOpen } = useCustomer();
  const { menuItems, categories } = useModuleData();
  const { link } = useRestaurantSlug();
  const searchParams = useSearchParams();
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType]       = useState("all");
  const [fastOnly, setFastOnly]           = useState(false);
  const [isLoaded, setIsLoaded]           = useState(false);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    const typeParam  = searchParams.get("type");
    const qParam     = searchParams.get("q");
    if (typeParam && ["dine-in", "takeaway", "delivery"].includes(typeParam)) setOrderType(typeParam);
    if (tableParam) { updateCustomer({ tableNumber: tableParam }); if (!typeParam) setOrderType("dine-in"); }
    if (qParam) setSearch(decodeURIComponent(qParam));
    setTimeout(() => setIsLoaded(true), 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeItems = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);

  const activeCategories = useMemo(() => {
    const ids = new Set(activeItems.map((m) => m.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [categories, activeItems]);

  const availableTypes = useMemo(() => {
    const types = new Set(activeItems.map((m) => m.itemType).filter(Boolean));
    return ["veg", "non-veg", "egg", "drink", "halal", "other"].filter((t) => types.has(t));
  }, [activeItems]);

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
  const cartBar    = cart.itemCount > 0;
  const hasFilters = search || activeCategory !== "all" || activeType !== "all" || fastOnly;

  return (
    <div className={`bg-gray-50 min-h-screen ${cartBar ? "pb-24 md:pb-0" : ""}`}>

      {/* ══ HERO HEADER ══ */}
      <div className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:px-8">
          {/* Order type badge */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {orderType ? (
              <button type="button" onClick={() => setOrderTypeModalOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${TYPE_COLOR[orderType]}`}>
                {OrderTypeIcon && <OrderTypeIcon className="size-3.5 shrink-0" />}
                {TYPE_LABEL[orderType]} · Change
              </button>
            ) : (
              <button type="button" onClick={() => setOrderTypeModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/30 bg-[#FF6B35]/5 px-4 py-1.5 text-xs font-semibold text-[#FF6B35]">
                Select Order Type
              </button>
            )}
            {cartBar && (
              <Link href={link("/order/cart")}
                className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-[#FF6B35]/20">
                <ShoppingCart className="size-3.5" />
                {cart.itemCount} items · {formatCustomerMoney(cart.subtotal)}
              </Link>
            )}
          </div>

          {/* Heading */}
          <h1 className="font-poppins text-3xl font-black text-[#111827] sm:text-4xl">
            Explore Our Delicious{" "}
            <span className="gradient-text">Foods Menu</span>
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            <span className="font-semibold text-[#FF6B35]">{filtered.length}</span> fresh dishes crafted with love
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className="relative flex items-center rounded-full border border-gray-200 bg-white px-4 py-2.5 shadow-md shadow-gray-100 focus-within:border-[#FF6B35]/40 focus-within:ring-2 focus-within:ring-[#FF6B35]/10">
              <Search className="size-4 shrink-0 text-gray-400" />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Ex: Search for food"
                autoComplete="off"
                className="flex-1 bg-transparent px-3 text-sm text-gray-800 outline-none placeholder:text-gray-400" />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    type="button" onClick={() => setSearch("")}
                    className="text-gray-400 hover:text-gray-600">
                    <X className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ITEMS GRID ══ */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Category + Type filters — gray section ke andar, items ke upar */}
        <div className="mb-5 space-y-2.5">
          {/* Category row */}
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <button type="button" onClick={() => setActiveCategory("all")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeCategory === "all" ? "gradient-primary text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"
              }`}>All</button>
            {activeCategories.map((c) => (
              <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeCategory === c.id ? "gradient-primary text-white shadow-sm" : "border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"
                }`}>{c.name}</button>
            ))}
          </div>
          {/* Type + fast row */}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setActiveType("all")}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeType === "all" ? "bg-[#111827] text-white" : "border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"
              }`}>All Types</button>
            {availableTypes.map((t) => {
              const meta = ITEM_TYPE_META[t];
              const isActive = activeType === t;
              return (
                <button key={t} type="button" onClick={() => setActiveType(isActive ? "all" : t)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive ? "bg-[#FF6B35]/10 text-[#FF6B35] ring-1 ring-[#FF6B35]/30" : "border border-gray-200 bg-white text-gray-500 hover:border-[#FF6B35]/30 hover:text-[#FF6B35]"
                  }`}>
                  {t === "veg" && <span className="inline-flex shrink-0 items-center justify-center" style={{ width: 11, height: 11, border: "2px solid #16a34a", borderRadius: 2, backgroundColor: "#fff" }}><span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#16a34a", display: "block" }} /></span>}
                  {t === "non-veg" && <span className="inline-flex shrink-0 items-center justify-center" style={{ width: 11, height: 11, border: "2px solid #92400e", borderRadius: 2, backgroundColor: "#fff" }}><span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "#92400e", display: "block" }} /></span>}
                  {t === "egg"   && <span className="size-2 shrink-0 rounded-full bg-yellow-400" />}
                  {t === "drink" && <span className="text-sm leading-none">🥤</span>}
                  {t === "halal" && <span className="text-sm leading-none">🍖</span>}
                  {meta?.label}
                </button>
              );
            })}
            <button type="button" onClick={() => setFastOnly((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                fastOnly ? "bg-amber-50 text-amber-600 ring-1 ring-amber-300" : "border border-gray-200 bg-white text-gray-500 hover:border-amber-300"
              }`}>
              <Zap className="size-3 shrink-0" /> Fast (&lt;10 min)
            </button>
            <AnimatePresence>
              {hasFilters && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  type="button" onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100">
                  <X className="size-3" /> Clear All
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        {!isLoaded ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-gray-50">
              <UtensilsCrossed className="size-10 text-gray-300" />
            </div>
            <p className="mt-5 font-poppins text-lg font-bold text-gray-800">No items match your filters</p>
            <p className="mt-1 text-sm text-gray-400">Try adjusting your filters or search term.</p>
            <button type="button"
              onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
              className="mt-6 rounded-full gradient-primary px-6 py-2.5 text-sm font-bold text-white shadow-md">
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item, i) => {
              const inCart = cart.lines.find((l) => l.id === item.id);
              const isFast = (item.prepTime ?? 99) < 10;
              return (
                <motion.article key={item.id}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  whileHover={{ y: -5 }}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-black/8">
                  {/* Image */}
                  <div className="relative aspect-[16/11] overflow-hidden">
                    <SafeDishImage src={item.image} alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      iconClassName="size-14 text-[#FF6B35]/20" />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
                    {item.badge && (
                      <span className="absolute left-3 top-3 rounded-full gradient-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                        {item.badge}
                      </span>
                    )}
                    {item.prepTime != null && (
                      <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm ${
                        isFast ? "bg-amber-400 text-white" : "bg-white/95 text-gray-600"
                      }`}>
                        {isFast ? <Zap className="size-2.5" /> : <Clock className="size-2.5" />}
                        {item.prepTime} min
                      </span>
                    )}
                    {/* Name + price overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-poppins text-sm font-bold text-white drop-shadow flex items-center gap-1.5 line-clamp-1">
                          <FoodTypeIndicator type={item.itemType} size={12} />
                          {item.name}
                        </h3>
                        {item.categoryName && (
                          <p className="text-[10px] text-white/65 mt-0.5">{item.categoryName}</p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-sm font-black text-[#FF6B35] shadow-md">
                        {formatCustomerMoney(item.price)}
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col p-4">
                    {item.description && (
                      <p className="line-clamp-2 text-xs leading-relaxed text-gray-400 mb-3">{item.description}</p>
                    )}
                    <button type="button" onClick={() => handleAdd(item)}
                      className={`mt-auto flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-all ${
                        inCart
                          ? "border-2 border-[#FF6B35] bg-white text-[#FF6B35]"
                          : "gradient-primary text-white shadow-md shadow-[#FF6B35]/25 hover:shadow-lg hover:shadow-[#FF6B35]/35"
                      }`}>
                      <Plus className="size-4 shrink-0" />
                      {inCart ? `In Cart (${inCart.qty})` : "Add to Cart"}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Mobile cart bar */}
      <AnimatePresence>
        {cartBar && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
            <Link href={link("/order/cart")}
              className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl gradient-primary px-5 py-4 shadow-2xl shadow-[#FF6B35]/30">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">{cart.itemCount}</span>
              <span className="flex-1 text-center text-sm font-bold text-white">View Cart</span>
              <span className="shrink-0 font-poppins text-sm font-bold text-white">{formatCustomerMoney(cart.subtotal)}</span>
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
      <div className="bg-gray-50 min-h-screen">
        <div className="h-52 bg-white border-b border-gray-100" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="skeleton aspect-[16/11]" />
                <div className="space-y-2 p-4">
                  <div className="skeleton h-4 w-3/4 rounded-full" />
                  <div className="skeleton h-3 w-full rounded-full" />
                  <div className="skeleton mt-3 h-10 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <CustomerMenuPageContent />
    </Suspense>
  );
}
