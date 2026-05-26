"use client";

import MenuItemCard from "@/components/customer/MenuItemCard";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { customerClasses, customerInteractive, customerPage, customerType } from "@/lib/customerTheme";
import { ITEM_TYPE_META } from "@/types/menu";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, UtensilsCrossed, Zap, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
const TYPE_COLOR = {
  "dine-in": "text-customer-primary bg-customer-primary/10 border-customer-primary/30",
  takeaway:  "text-amber-600 bg-amber-50 border-amber-200",
  delivery:  "text-rose-600 bg-rose-50 border-rose-200",
};

function SkeletonCard() {
  return (
    <div className="overflow-hidden ct-surface-card shadow-sm">
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
  const { content: cms } = useRestaurantCms();
  const L = mergeCmsSection(DEFAULTS.menu, cms.menu);
  const searchParams = useSearchParams();
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType]       = useState("all");
  const [fastOnly, setFastOnly]           = useState(false);
  const [isLoaded, setIsLoaded]           = useState(false);

  useEffect(() => {
    const tableParam = searchParams.get("table");
    const typeParam = searchParams.get("type");
    const qParam = searchParams.get("q");
    const categoryParam = searchParams.get("category");
    if (typeParam && ["dine-in", "takeaway", "delivery"].includes(typeParam)) setOrderType(typeParam);
    if (tableParam) {
      updateCustomer({ tableNumber: tableParam });
      if (!typeParam) setOrderType("dine-in");
    }
    if (qParam) setSearch(decodeURIComponent(qParam));
    else setSearch("");
    if (categoryParam) setActiveCategory(categoryParam);
    setIsLoaded(true);
  }, [searchParams, setOrderType, updateCustomer]);

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
    <div className={`ct-page-shell ${cartBar ? "pb-24 md:pb-0" : ""}`}>

      {/* ══ HERO HEADER ══ */}
      <div className="ct-page-header">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:px-8">
          {/* Order type badge */}
          <div className="mb-4 flex items-center justify-center gap-2">
            {orderType ? (
              <button type="button" onClick={() => setOrderTypeModalOpen(true)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${TYPE_COLOR[orderType]}`}>
                {OrderTypeIcon && <OrderTypeIcon className="size-3.5 shrink-0" />}
                {TYPE_LABEL[orderType]} · {L.changeOrderType?.trim() || "Change"}
              </button>
            ) : (
              <button type="button" onClick={() => setOrderTypeModalOpen(true)}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-customer-primary/30 bg-customer-primary/5 px-4 py-1.5 text-xs font-semibold text-customer-primary">
                {L.selectOrderType?.trim() || "Select Order Type"}
              </button>
            )}
            {cartBar && (
              <Link href={link("/order/cart")}
                className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm shadow-[var(--customer-primary-shadow)]/20">
                <ShoppingCart className="size-3.5" />
                {cart.itemCount} items · {formatCustomerMoney(cart.subtotal)}
              </Link>
            )}
          </div>

          {/* Heading */}
          <h1 className={`${customerType.heroTitle} text-3xl sm:text-4xl`}>
            {L.titlePrefix?.trim() || "Explore Our Delicious"}{" "}
            {L.titleHighlight?.trim() ? (
              <span className="gradient-text">{L.titleHighlight}</span>
            ) : null}
          </h1>
          <p className="mt-2 text-sm text-customer-muted">
            <span className="font-semibold text-customer-primary">{filtered.length}</span>{" "}
            {L.subtitleSuffix?.trim() || "fresh dishes crafted with love"}
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-6 max-w-xl">
            <div className={customerInteractive.inputWrap}>
              <Search className={`size-4 shrink-0 ${customerInteractive.inputIcon}`} aria-hidden />
              <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={L.searchPlaceholder?.trim() || "Ex: Search for food"}
                autoComplete="off"
                aria-label="Search menu"
                className={customerInteractive.input} />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    type="button" onClick={() => setSearch("")}
                    className="text-customer-muted hover:text-customer-muted">
                    <X className="size-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ITEMS GRID ══ */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8 lg:px-8">

        <div className="mb-6 space-y-3">
          {/* Category row */}
          <div className={`${customerInteractive.pillScroll} -mx-4 gap-2 px-4 pb-0.5 sm:mx-0 sm:px-0`}>
            <button type="button" onClick={() => setActiveCategory("all")}
              className={activeCategory === "all" ? customerClasses.chipActive : customerClasses.chip}>
              {L.allCategoryLabel?.trim() || "All"}
            </button>
            {activeCategories.map((c) => (
              <button key={c.id} type="button" onClick={() => setActiveCategory(c.id)}
                className={activeCategory === c.id ? customerClasses.chipActive : customerClasses.chip}>
                {c.name}
              </button>
            ))}
          </div>
          {/* Type + fast row */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveType("all")}
              className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeType === "all"
                  ? "gradient-primary text-[var(--customer-btn-primary-fg,#ffffff)] shadow-sm"
                  : "border border-customer-border bg-[var(--customer-card)] text-customer-muted hover:border-customer-primary/30 hover:text-customer-primary"
              }`}>{L.allTypesLabel?.trim() || "All Types"}</button>
            {availableTypes.map((t) => {
              const meta = ITEM_TYPE_META[t];
              const isActive = activeType === t;
              return (
                <button key={t} type="button" onClick={() => setActiveType(isActive ? "all" : t)}
                  className={`shrink-0 cursor-pointer inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isActive ? "bg-customer-primary/10 text-customer-primary ring-1 ring-[var(--customer-primary)]/30" : "border border-customer-border bg-[var(--customer-card)] text-customer-muted hover:border-customer-primary/30 hover:text-customer-primary"
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
              className={`cursor-pointer shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                fastOnly ? "bg-amber-50 text-amber-600 ring-1 ring-amber-300" : "border border-customer-border bg-[var(--customer-card)] text-customer-muted hover:border-amber-300"
              }`}>
              <Zap className="size-3 shrink-0" /> {L.fastFilterLabel?.trim() || "Fast (<10 min)"}
            </button>
            <AnimatePresence>
              {hasFilters && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  type="button" onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
                  className="shrink-0 inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100">
                  <X className="size-3" /> {L.clearAllLabel?.trim() || "Clear All"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        {!isLoaded ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : activeItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-customer-primary/25 bg-white px-6 py-20 text-center"
          >
            <div className="flex size-20 items-center justify-center rounded-3xl bg-customer-primary/10">
              <UtensilsCrossed className="size-10 text-customer-primary/50" />
            </div>
            <p className="mt-5 font-poppins text-lg font-bold text-customer-text">{L.emptyMenuTitle?.trim() || "Menu coming soon"}</p>
            <p className="mt-1 max-w-sm text-sm text-customer-muted">
              {L.emptyMenuSubtitle?.trim() ||
                "This restaurant hasn't published dishes yet. Please check back later or contact the team."}
            </p>
            <Link
              href={link("/order/contact")}
              className="mt-6 rounded-full gradient-primary px-6 py-2.5 text-sm font-bold text-white shadow-md"
            >
              {L.emptyMenuCta?.trim() || "Contact restaurant"}
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-customer-border bg-white px-6 py-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-[var(--customer-cream)]">
              <UtensilsCrossed className="size-10 text-customer-muted" />
            </div>
            <p className="mt-5 font-poppins text-lg font-bold text-customer-text">{L.emptyStateTitle?.trim() || "No items match your filters"}</p>
            <p className="mt-1 text-sm text-customer-muted">{L.emptyStateSubtitle?.trim() || "Try adjusting your filters or search term."}</p>
            <button type="button"
              onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
              className="mt-6 rounded-full gradient-primary px-6 py-2.5 text-sm font-bold text-white shadow-md">
              {L.clearFiltersLabel?.trim() || "Clear Filters"}
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
            {filtered.map((item, i) => (
              <MenuItemCard
                key={item.id}
                item={item}
                inCart={cart.lines.find((l) => l.id === item.id)}
                addLabel={L.addToCartLabel?.trim() || "Add to Cart"}
                inCartLabel={L.inCartLabel?.trim() || "In Cart"}
                onAdd={handleAdd}
                motionProps={{
                  initial: { opacity: 0, y: 16 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: Math.min(i * 0.04, 0.4) },
                  whileHover: { y: -4 },
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Mobile cart bar */}
      <AnimatePresence>
        {cartBar && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
            <Link href={link("/order/cart")}
              className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl gradient-primary px-5 py-4 shadow-2xl shadow-[var(--customer-primary-shadow)]/30">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 text-sm font-bold text-white">{cart.itemCount}</span>
              <span className="flex-1 text-center text-sm font-bold text-white">{L.viewCartLabel?.trim() || "View Cart"}</span>
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
      <div className="ct-page-shell">
        <div className="h-52 ct-page-header" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden ct-surface-card shadow-sm">
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
