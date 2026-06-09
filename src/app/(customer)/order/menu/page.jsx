"use client";

import MenuItemCard from "@/components/customer/MenuItemCard";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import { orderTypeChipClass } from "@/lib/customerOrderTypeStyles";
import { customerClasses, customerInteractive, customerPage, customerType } from "@/lib/customerTheme";
import ItemTypeChipIcon, { FastFilterChipIcon } from "@/components/menu/ItemTypeChipIcon";
import { ITEM_TYPE_META } from "@/types/menu";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";

const TYPE_ICON  = { "dine-in": Store, takeaway: ConciergeBell, delivery: Bike };
const TYPE_LABEL = { "dine-in": "Dine-In", takeaway: "Takeaway", delivery: "Delivery" };
function SkeletonCard() {
  return (
    <div className="overflow-hidden ct-surface-card">
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
  const { cart, setOrderTypeModalOpen, orderType, setOrderType, updateCustomer, tryAddToCart } = useCustomer();
  const { menuItems, categories, hydrated } = useModuleData();
  const { link } = useRestaurantSlug();
  const { content: cms } = useRestaurantCms();
  const L = mergeCmsSection(DEFAULTS.menu, cms.menu);
  const searchParams = useSearchParams();
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType]       = useState("all");
  const [fastOnly, setFastOnly]           = useState(false);
  const [sortBy, setSortBy]               = useState("default");
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
    const list = activeItems.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
      if (activeType !== "all" && item.itemType !== activeType) return false;
      if (fastOnly && (item.prepTime ?? 99) >= 10) return false;
      if (q && !`${item.name} ${item.categoryName}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortBy === "price-asc") return [...list].sort((a, b) => Number(a.price) - Number(b.price));
    if (sortBy === "price-desc") return [...list].sort((a, b) => Number(b.price) - Number(a.price));
    if (sortBy === "name") return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sortBy === "fast") return [...list].sort((a, b) => Number(a.prepTime ?? 99) - Number(b.prepTime ?? 99));
    return list;
  }, [activeItems, search, activeCategory, activeType, fastOnly, sortBy]);

  const handleAdd = (item) => tryAddToCart(item);

  const OrderTypeIcon = orderType ? TYPE_ICON[orderType] : null;
  const cartBar    = cart.itemCount > 0;
  const hasFilters = search || activeCategory !== "all" || activeType !== "all" || fastOnly;

  return (
    <div className={`ct-page-shell ${cartBar ? "pb-24 md:pb-0" : ""}`}>

      {/* ══ HERO HEADER ══ */}
      <div className="ct-page-header">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:px-8">
          {/* Order type badge */}
          <div className="mb-4 flex max-w-full flex-wrap items-center justify-center gap-2 px-1">
            {orderType ? (
              <button type="button" onClick={() => setOrderTypeModalOpen(true)}
                className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold ${orderTypeChipClass(orderType)}`}>
                {OrderTypeIcon && <OrderTypeIcon className="size-3.5 shrink-0" />}
                <span className="truncate">{TYPE_LABEL[orderType]}</span>
                <span className="hidden sm:inline">· {L.changeOrderType?.trim() || "Change"}</span>
              </button>
            ) : (
              <button type="button" onClick={() => setOrderTypeModalOpen(true)}
                className="inline-flex max-w-full cursor-pointer items-center gap-2 rounded-full border border-customer-primary/30 bg-customer-primary/5 px-4 py-1.5 text-xs font-semibold text-customer-primary">
                {L.selectOrderType?.trim() || "Select Order Type"}
              </button>
            )}
            {cartBar && (
              <Link href={link("/order/cart")}
                className={`${customerClasses.btnPrimary} max-w-full gap-1.5 px-4 py-1.5 text-xs`}>
                <ShoppingCart className="size-3.5 shrink-0" />
                <span className="sm:hidden">{cart.itemCount} · {formatCustomerMoney(cart.subtotal)}</span>
                <span className="hidden sm:inline">{cart.itemCount} items · {formatCustomerMoney(cart.subtotal)}</span>
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
              <input
                type="text"
                inputMode="search"
                enterKeyHint="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={L.searchPlaceholder?.trim() || "Ex: Search for food"}
                autoComplete="off"
                aria-label="Search menu"
                role="searchbox"
                className={customerInteractive.input}
              />
              <AnimatePresence>
                {search && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    type="button" onClick={() => setSearch("")}
                    aria-label="Clear search"
                    className="flex size-10 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-full text-customer-muted transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-text">
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
          {activeCategories.length > 3 && (
            <p className="text-center text-[11px] font-medium text-customer-muted sm:hidden">
              Swipe for more categories →
            </p>
          )}
          {/* Type + fast row */}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setActiveType("all")}
              className={`shrink-0 ${activeType === "all" ? customerClasses.chipActive : customerClasses.chip}`}>
              {L.allTypesLabel?.trim() || "All Types"}
            </button>
            {availableTypes.map((t) => {
              const meta = ITEM_TYPE_META[t];
              const isActive = activeType === t;
              return (
                <button key={t} type="button" onClick={() => setActiveType(isActive ? "all" : t)}
                  className={`shrink-0 inline-flex items-center gap-1.5 ${isActive ? customerClasses.chipActive : customerClasses.chip}`}>
                  <ItemTypeChipIcon type={t} />
                  {meta?.label}
                </button>
              );
            })}
            <button type="button" onClick={() => setFastOnly((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1.5 ${fastOnly ? customerClasses.chipActive : customerClasses.chip}`}>
              <FastFilterChipIcon /> {L.fastFilterLabel?.trim() || "Fast (<10 min)"}
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`shrink-0 ${customerClasses.selectChip}`}
              aria-label="Sort menu"
            >
              <option value="default">Sort: Default</option>
              <option value="name">Name A–Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="fast">Fastest first</option>
            </select>
            <AnimatePresence>
              {hasFilters && (
                <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  type="button" onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
                  className={`shrink-0 inline-flex items-center gap-1 ${customerClasses.chip} !border-[color-mix(in_srgb,#ef4444_35%,var(--customer-border))] !text-[color-mix(in_srgb,#ef4444_78%,var(--customer-text))] hover:!bg-[color-mix(in_srgb,#ef4444_10%,var(--customer-card))]`}>
                  <X className="size-3" /> {L.clearAllLabel?.trim() || "Clear All"}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
        {!hydrated || !isLoaded ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : activeItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-customer-primary/25 bg-[var(--customer-card)] px-6 py-20 text-center"
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
              className={`mt-6 ${customerClasses.btnPrimary} px-6 py-2.5 text-sm`}
            >
              {L.emptyMenuCta?.trim() || "Contact restaurant"}
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-customer-border bg-[var(--customer-card)] px-6 py-20 text-center">
            <div className="flex size-20 items-center justify-center rounded-3xl bg-[var(--customer-cream)]">
              <UtensilsCrossed className="size-10 text-customer-muted" />
            </div>
            <p className="mt-5 font-poppins text-lg font-bold text-customer-text">{L.emptyStateTitle?.trim() || "No items match your filters"}</p>
            <p className="mt-1 text-sm text-customer-muted">{L.emptyStateSubtitle?.trim() || "Try adjusting your filters or search term."}</p>
            <button type="button"
              onClick={() => { setSearch(""); setActiveCategory("all"); setActiveType("all"); setFastOnly(false); }}
              className={`mt-6 ${customerClasses.btnPrimary} px-6 py-2.5 text-sm`}>
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
                detailHref={link(`/order/menu/${item.id}`)}
                motionProps={{
                  initial: { opacity: 0, y: 12 },
                  animate: { opacity: 1, y: 0 },
                  transition: { delay: Math.min(i * 0.035, 0.35), ease: [0.22, 1, 0.36, 1] },
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
              className={`ct-elevation-float mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl px-5 py-4 ${customerClasses.btnPrimary}`}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--customer-btn-primary-fg)]/20 text-sm font-bold">{cart.itemCount}</span>
              <span className="flex-1 text-center text-sm font-bold">{L.viewCartLabel?.trim() || "View Cart"}</span>
              <span className="shrink-0 font-poppins text-sm font-bold">{formatCustomerMoney(cart.subtotal)}</span>
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
              <div key={i} className="overflow-hidden ct-surface-card">
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
