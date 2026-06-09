"use client";

import CustomerSection from "@/components/customer/CustomerSection";
import SafeDishImage from "@/components/customer/SafeDishImage";
import { CUSTOMER_HOME_CATEGORIES } from "@/config/customerContent";
import { pickSectionHeaders } from "@/lib/customerCmsMerge";
import {
  customerClasses,
  customerInteractive,
  customerMotion,
  customerOverlay,
} from "@/lib/customerTheme";
import { motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const fadeUp = customerMotion.fadeUpSm;

const FALLBACK_IMAGE_BY_LABEL = Object.fromEntries(
  CUSTOMER_HOME_CATEGORIES.map((c) => [c.label.toLowerCase().trim(), c.image])
);

const DEFAULT_FALLBACK_IMAGE = CUSTOMER_HOME_CATEGORIES[0]?.image ?? "";

function normId(id) {
  return String(id ?? "").trim();
}

function pickImage(name, explicitUrl) {
  if (explicitUrl?.trim()) return explicitUrl.trim();
  const key = String(name ?? "").toLowerCase().trim();
  return FALLBACK_IMAGE_BY_LABEL[key] ?? DEFAULT_FALLBACK_IMAGE;
}

function buildBrowseItems(categories, menuItems, link) {
  const active = menuItems.filter((m) => m.status === "active");
  const countByCategory = active.reduce((acc, m) => {
    const id = normId(m.categoryId);
    if (!id) return acc;
    acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  const staticFallback = CUSTOMER_HOME_CATEGORIES.map((cat, index) => ({
    id: `fallback-${index}`,
    label: cat.label,
    image: cat.image,
    count: null,
    href: link("/order/menu"),
  }));

  if (!Array.isArray(categories) || categories.length === 0) {
    return { items: staticFallback, live: false, totalDishes: active.length };
  }

  const fromDb = categories
    .map((c) => {
      const id = normId(c.id);
      const count = countByCategory[id] ?? 0;
      return {
        id: id || `cat-${c.name}`,
        label: c.name ?? "Category",
        image: pickImage(c.name, c.imageUrl ?? c.image),
        count,
        href: id ? link(`/order/menu?category=${encodeURIComponent(id)}`) : link("/order/menu"),
      };
    })
    .filter((c) => c.label);

  if (fromDb.length === 0) {
    return { items: staticFallback, live: false, totalDishes: active.length };
  }

  const withItems = fromDb.filter((c) => c.count > 0);
  const items =
    withItems.length > 0 ? withItems : fromDb.length <= 12 ? fromDb : staticFallback;

  return {
    items,
    live: items.length > 0,
    totalDishes: active.length,
  };
}

function CategoryCard({ cat }) {
  return (
    <Link
      href={cat.href}
      className="group flex h-full w-[10.5rem] shrink-0 flex-col sm:w-[11.5rem] lg:w-full"
    >
      <div className={`overflow-hidden ${customerInteractive.cardMotion}`}>
        <div className="ct-media-zoom relative aspect-[4/5] overflow-hidden rounded-2xl bg-customer-cream">
          <SafeDishImage
            src={cat.image}
            alt={cat.label}
            className="h-full w-full object-cover"
            iconClassName="size-12 text-customer-primary/35"
          />
          <div className={customerOverlay.gradientBottom} />
          {cat.count != null && cat.count > 0 ? (
            <span className="absolute right-2 top-2 rounded-full border border-customer-border bg-[var(--customer-card)]/95 px-2.5 py-1 text-[10px] font-bold text-customer-text">
              {cat.count} {cat.count === 1 ? "dish" : "dishes"}
            </span>
          ) : null}
          <span className={`absolute bottom-2 left-2 right-2 z-[1] truncate text-sm font-bold ${customerOverlay.title}`}>
            {cat.label}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function CategoryBrowseSection({
  categories = [],
  menuItems = [],
  link,
  cms,
}) {
  const catH = pickSectionHeaders(cms, "categories", {
    badge: "Browse",
    title: "Explore Your Dish",
    subtitle: "Browse by category and find exactly what you're craving.",
    actionLabel: "View full menu",
  });
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const { items, live, totalDishes } = useMemo(
    () => buildBrowseItems(categories, menuItems, link),
    [categories, menuItems, link]
  );

  const useCarousel = items.length > 4;

  const updateScrollHints = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollHints();
    const el = scrollRef.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(() => updateScrollHints());
    observer.observe(el);
    return () => observer.disconnect();
  }, [items.length, updateScrollHints]);

  const scrollByDir = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.75), behavior: "smooth" });
    setTimeout(updateScrollHints, 350);
  };

  const headerAction = (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      {useCarousel && (
        <div className="hidden items-center gap-2 sm:flex lg:hidden">
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-customer-border bg-[var(--customer-card)] text-customer-muted transition-all hover:border-customer-primary/40 hover:text-customer-primary disabled:opacity-35"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-customer-border bg-[var(--customer-card)] text-customer-muted transition-all hover:border-customer-primary/40 hover:text-customer-primary disabled:opacity-35"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      )}
      <Link
        href={link("/order/menu")}
        className={`${customerClasses.btnSecondary} min-h-[44px] gap-2 px-6 py-3 text-sm`}
      >
        {catH.actionLabel || "View full menu"} <ArrowRight className="size-4" aria-hidden />
      </Link>
    </div>
  );

  const metaLine =
    items.length > 0 ? (
      <div className="mb-6 flex flex-wrap justify-center gap-2 lg:justify-start">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-customer-border bg-[var(--customer-card)] px-3 py-1.5 text-xs font-semibold text-customer-muted">
          <UtensilsCrossed className="size-3.5 text-customer-primary" aria-hidden />
          {items.length} {items.length === 1 ? "category" : "categories"}
        </span>
        {live && totalDishes > 0 && (
          <span className="inline-flex rounded-full bg-customer-primary/10 px-3 py-1.5 text-xs font-semibold text-customer-primary">
            {totalDishes} dishes available
          </span>
        )}
      </div>
    ) : null;

  return (
    <CustomerSection
      variant="white"
      badge={catH.badge}
      title={catH.title}
      subtitle={catH.subtitle}
      align="split"
      action={headerAction}
    >
      {metaLine}

      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-customer-primary/30 bg-[var(--customer-card)] px-6 py-14 text-center">
          <UtensilsCrossed className="mx-auto size-10 text-customer-primary/40" aria-hidden />
          <p className="mt-4 text-sm text-customer-muted">Categories will show once your menu is ready.</p>
          <Link href={link("/order/menu")} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-customer-primary hover:underline">
            Browse menu <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : (
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className={customerClasses.panel}>
          <div
            ref={scrollRef}
            onScroll={updateScrollHints}
            className={
              useCarousel
                ? "flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin] snap-x snap-mandatory sm:gap-5 lg:grid lg:grid-cols-4 lg:overflow-visible lg:snap-none xl:grid-cols-7"
                : "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-7"
            }
          >
            {items.map((cat) => (
              <div key={cat.id} className={useCarousel ? "snap-start lg:min-w-0" : "min-w-0"}>
                <CategoryCard cat={cat} />
              </div>
            ))}
          </div>
          {useCarousel && (
            <p className="mt-3 text-center text-[11px] font-medium text-customer-muted lg:hidden">
              Swipe for more →
            </p>
          )}
        </motion.div>
      )}

      {items.length > 0 && items.length <= 8 && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {items.slice(0, 6).map((cat) => (
            <Link key={`pill-${cat.id}`} href={cat.href} className={customerClasses.chip}>
              {cat.label}
            </Link>
          ))}
        </div>
      )}
    </CustomerSection>
  );
}
