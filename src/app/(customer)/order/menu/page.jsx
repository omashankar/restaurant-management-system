"use client";

import CustomerCouponOffers from "@/components/customer/CustomerCouponOffers";
import MenuFiltersBar from "@/components/customer/MenuFiltersBar";
import MenuItemCard from "@/components/customer/MenuItemCard";
import MenuItemSizePickerModal from "@/components/menu/MenuItemSizePickerModal";
import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useCheckoutMeta } from "@/hooks/useCheckoutMeta";
import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import {
  buildSimpleCartLine,
  buildSizedCartLine,
  getMenuItemCartState,
  getMenuItemDisplayPrice,
  itemHasSizes,
} from "@/lib/menuItemSizes";
import { orderTypeChipClass } from "@/lib/customerOrderTypeStyles";
import { customerClasses, customerInteractive, customerPage, customerType } from "@/lib/customerTheme";
import { motion, AnimatePresence } from "framer-motion";
import { Bike, Clock, ConciergeBell, Plus, Search, ShoppingCart, Store, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";

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
  const { meta: checkoutMeta } = useCheckoutMeta();
  const { content: cms } = useRestaurantCms();
  const L = mergeCmsSection(DEFAULTS.menu, cms.menu);
  const searchParams = useSearchParams();
  const [search, setSearch]               = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType]       = useState("all");
  const [fastOnly, setFastOnly]           = useState(false);
  const [sortBy, setSortBy]               = useState("default");
  const [isLoaded, setIsLoaded]           = useState(false);
  const [sizePickerItem, setSizePickerItem] = useState(null);

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
    setActiveCategory(categoryParam?.trim() || "all");
    setIsLoaded(true);
  }, [searchParams, setOrderType, updateCustomer]);

  const activeItems = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);

  const activeCategories = useMemo(() => {
    const ids = new Set(activeItems.map((m) => m.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [categories, activeItems]);

  const itemsForTypeFilter = useMemo(() => {
    if (activeCategory === "all") return activeItems;
    return activeItems.filter((m) => m.categoryId === activeCategory);
  }, [activeItems, activeCategory]);

  const availableTypes = useMemo(() => {
    const types = new Set(itemsForTypeFilter.map((m) => m.itemType).filter(Boolean));
    return ["veg", "non-veg", "egg", "drink", "halal", "other"].filter((t) => types.has(t));
  }, [itemsForTypeFilter]);

  const hasFastItems = useMemo(
    () => itemsForTypeFilter.some((m) => (m.prepTime ?? 99) < 10),
    [itemsForTypeFilter]
  );

  useEffect(() => {
    if (
      activeCategory !== "all" &&
      activeCategories.length > 0 &&
      !activeCategories.some((c) => c.id === activeCategory)
    ) {
      setActiveCategory("all");
    }
    if (activeType !== "all" && !availableTypes.includes(activeType)) {
      setActiveType("all");
    }
    if (fastOnly && !hasFastItems) {
      setFastOnly(false);
    }
  }, [activeCategory, activeCategories, activeType, availableTypes, fastOnly, hasFastItems]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = activeItems.filter((item) => {
      if (activeCategory !== "all" && item.categoryId !== activeCategory) return false;
      if (activeType !== "all" && item.itemType !== activeType) return false;
      if (fastOnly && (item.prepTime ?? 99) >= 10) return false;
      if (q && !`${item.name} ${item.categoryName}`.toLowerCase().includes(q)) return false;
      return true;
    });
    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => getMenuItemDisplayPrice(a) - getMenuItemDisplayPrice(b));
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => getMenuItemDisplayPrice(b) - getMenuItemDisplayPrice(a));
    }
    if (sortBy === "name") return [...list].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    if (sortBy === "fast") return [...list].sort((a, b) => Number(a.prepTime ?? 99) - Number(b.prepTime ?? 99));
    return list;
  }, [activeItems, search, activeCategory, activeType, fastOnly, sortBy]);

  const handleAdd = (item) => {
    if (itemHasSizes(item)) {
      setSizePickerItem(item);
      return;
    }
    tryAddToCart(buildSimpleCartLine(item));
  };

  const isItemInCart = useCallback(
    (itemId) => getMenuItemCartState(cart.lines, itemId),
    [cart.lines]
  );

  const clearAllFilters = useCallback(() => {
    setSearch("");
    setActiveCategory("all");
    setActiveType("all");
    setFastOnly(false);
  }, []);

  const OrderTypeIcon = orderType ? TYPE_ICON[orderType] : null;
  const cartBar    = cart.itemCount > 0;
  const hasFilters =
    Boolean(search.trim()) ||
    activeCategory !== "all" ||
    activeType !== "all" ||
    fastOnly;

  const heroCountText = useMemo(() => {
    if (!hydrated || !isLoaded) return null;
    const total = activeItems.length;
    const count = filtered.length;
    if (hasFilters && total > 0) {
      return (L.showingOfLabel || "Showing {count} of {total} dishes")
        .replace("{count}", String(count))
        .replace("{total}", String(total));
    }
    return (L.allDishesLabel || "{total} dishes available").replace("{total}", String(total));
  }, [hydrated, isLoaded, activeItems.length, filtered.length, hasFilters, L]);

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
          {heroCountText ? (
            <p className="mt-2 text-sm font-medium text-customer-muted">{heroCountText}</p>
          ) : (
            <p className="mt-2 text-sm text-customer-muted">
              {L.subtitleSuffix?.trim() || "Fresh dishes crafted with love"}
            </p>
          )}

          {(checkoutMeta.coupons ?? []).length > 0 ? (
            <CustomerCouponOffers
              coupons={checkoutMeta.coupons}
              mode="banner"
              className="mt-4 px-2"
            />
          ) : null}

          {/* Search bar */}
          <div className="mx-auto mt-6 max-w-xl">
            <p className="mb-2 text-center text-[11px] font-medium text-customer-muted">
              Search by dish name
            </p>
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

        {hydrated && isLoaded && activeItems.length > 0 ? (
          <div className="mb-6 min-w-0">
            <MenuFiltersBar
              labels={L}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              activeCategories={activeCategories}
              activeType={activeType}
              onTypeChange={setActiveType}
              availableTypes={availableTypes}
              fastOnly={fastOnly}
              onFastToggle={setFastOnly}
              hasFastItems={hasFastItems}
              sortBy={sortBy}
              onSortChange={setSortBy}
              hasFilters={hasFilters}
              onClearAll={clearAllFilters}
              filteredCount={filtered.length}
              totalCount={activeItems.length}
              searchQuery={search}
              onClearSearch={() => setSearch("")}
            />
          </div>
        ) : null}
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
            <p className="mt-5 font-poppins text-lg font-bold text-customer-text">
              {L.emptyStateTitle?.trim() || "No dishes match"}
            </p>
            <p className="mt-1 max-w-md text-sm text-customer-muted">
              {L.emptyStateSubtitle?.trim() ||
                "Nothing fits your current search or filters. Try another category or clear filters below."}
            </p>
            {hasFilters ? (
              <p className="mt-3 text-xs font-medium text-customer-primary">
                Tip: tap &quot;Clear all filters&quot; in the refine menu above.
              </p>
            ) : null}
            <button type="button"
              onClick={clearAllFilters}
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
                inCart={isItemInCart(item.id)}
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

      <MenuItemSizePickerModal
        open={Boolean(sizePickerItem)}
        item={sizePickerItem}
        onClose={() => setSizePickerItem(null)}
        onSelect={(size) => {
          if (!sizePickerItem) return;
          tryAddToCart(buildSizedCartLine(sizePickerItem, size));
        }}
        formatMoney={formatCustomerMoney}
        tone="customer"
      />
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
