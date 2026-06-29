"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useModuleData } from "@/context/ModuleDataContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { getActiveBanners, useRestaurantCms } from "@/hooks/useRestaurantCms";
import CategoryBrowseSection from "@/components/customer/CategoryBrowseSection";
import MenuItemCard from "@/components/customer/MenuItemCard";
import MenuItemSizePickerModal from "@/components/menu/MenuItemSizePickerModal";
import { CustomerSectionHeader } from "@/components/customer/CustomerSection";
import SafeDishImage from "@/components/customer/SafeDishImage";
import {
  customerClasses,
  customerInteractive,
  customerLayout,
  customerMotion,
  customerOverlay,
  customerSectionBg,
  customerType,
} from "@/lib/customerTheme";
import { formatCustomerMoney } from "@/lib/customerCurrency";
import {
  buildSimpleCartLine,
  buildSizedCartLine,
  getMenuItemCartState,
  itemHasSizes,
} from "@/lib/menuItemSizes";
import { DEFAULT_HERO_IMAGE, DEFAULT_PROMO_SLIDE_IMAGE, DEFAULTS } from "@/lib/restaurantCmsDefaults";
import { mergeCmsSection, pickSectionHeaders } from "@/lib/customerCmsMerge";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { motion, useInView } from "framer-motion";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ArrowRight, BarChart3, Bike, CalendarClock, ChefHat,
  ChevronRight, ConciergeBell, CreditCard, LayoutGrid,
  PackageSearch, Search, Star, Store, Flame, Award, TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const fadeUp = customerMotion.fadeUp;
const stagger = customerMotion.stagger;

const STEP_ICON_MAP = {
  "layout-grid": LayoutGrid, "credit-card": CreditCard,
  "package-search": PackageSearch, "chef-hat": ChefHat, "bar-chart-3": BarChart3,
};

const ORDER_TYPE_UI = {
  "dine-in":  { Icon: Store, accent: "text-customer-primary" },
  takeaway:   { Icon: ConciergeBell, accent: "text-customer-primary" },
  delivery:   { Icon: Bike, accent: "text-customer-primary" },
};

function AnimatedSection({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function resolvePromoHref(path, linkFn) {
  const p = path?.trim();
  if (!p) return linkFn("/order/menu");
  if (p.startsWith("http")) return p;
  return linkFn(p.startsWith("/") ? p : `/${p}`);
}

/* ── Promo Banner Slider ── */
function PromoBannerSlider({ banners, link }) {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  const next = useCallback(() => {
    setActive((p) => (p + 1) % banners.length);
    setAnimKey((k) => k + 1);
  }, [banners.length]);

  const prev = () => {
    setActive((p) => (p - 1 + banners.length) % banners.length);
    setAnimKey((k) => k + 1);
  };

  useEffect(() => {
    timerRef.current = setInterval(next, 5000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, 5000);
  };

  const b = banners[active];

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Background images — all preloaded, only active visible */}
      {banners.map((ban, i) => (
        <div
          key={ban.id ?? `slide-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${i === active ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={normalizeLogoSrc(ban.image) || DEFAULT_PROMO_SLIDE_IMAGE}
            alt={ban.title || "Promo"}
            className="h-full w-full object-cover"
            onError={(e) => { e.target.src = DEFAULT_PROMO_SLIDE_IMAGE; }}
          />
        </div>
      ))}

      <div className={customerOverlay.gradientPromo} />
      <div className={customerOverlay.gradientPromoVignette} />

      {/* Content — extra bottom padding for dot row; side padding on sm+ for arrows */}
      <div className="relative z-[1] flex min-h-[260px] flex-col justify-center px-5 pb-16 pt-8 sm:min-h-[300px] sm:px-16 sm:pb-14 sm:pt-10 lg:min-h-[320px] lg:px-20">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="max-w-lg pr-2 sm:pr-0"
        >
          {/* Badge */}
          <div className="mb-4 flex items-center gap-2">
            {b.badge?.trim() && (
            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${customerOverlay.glassPill}`}>
              <span className="size-1.5 rounded-full bg-customer-primary animate-pulse" />
              {b.badge}
            </span>
            )}
            {b.discount && (
              <span className="rounded-full bg-customer-primary px-3 py-1 text-xs font-black text-white">
                {b.discount}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-poppins text-3xl font-black leading-[1.1] sm:text-4xl lg:text-5xl ${customerOverlay.title}`}>
            {b.title}
          </h3>

          <p className={`mt-3 max-w-[min(100%,20rem)] text-sm leading-relaxed sm:max-w-lg sm:text-base ${customerOverlay.subtitle}`}>
            {b.subtitle}
          </p>

          {/* CTA */}
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
            <Link
              href={resolvePromoHref(b.ctaLink, link)}
              className={`${customerClasses.btnPrimary} gap-2 px-7 py-3 text-sm transition-transform hover:scale-[1.03]`}
            >
              {b.ctaLabel || "Order Now"} <ChevronRight className="size-4" />
            </Link>
            {b.secondaryCtaLabel?.trim() && (
              <Link
                href={resolvePromoHref(b.secondaryCtaLink, link)}
                className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all hover:bg-white/25 ${customerOverlay.glassPill}`}
              >
                {b.secondaryCtaLabel}
              </Link>
            )}
          </div>
        </motion.div>
      </div>

      {/* Slide counter top-right */}
      <div className="absolute right-4 top-4 z-[2] rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm sm:right-5 sm:top-5">
        {active + 1} / {banners.length}
      </div>

      {/* Prev / next — tablet+ only (mobile uses dots; avoids text overlap) */}
      <button
        type="button"
        onClick={() => { prev(); resetTimer(); }}
        className="absolute left-3 top-1/2 z-[2] hidden size-11 min-h-[44px] min-w-[44px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-[transform,background-color] duration-200 hover:scale-[1.03] hover:bg-black/65 sm:flex sm:left-4"
        aria-label="Previous slide"
      >
        <ChevronRight className="size-5 rotate-180" />
      </button>

      <button
        type="button"
        onClick={() => { next(); resetTimer(); }}
        className="absolute right-3 top-1/2 z-[2] hidden size-11 min-h-[44px] min-w-[44px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-[transform,background-color] duration-200 hover:scale-[1.03] hover:bg-black/65 sm:flex sm:right-4"
        aria-label="Next slide"
      >
        <ChevronRight className="size-5" />
      </button>

      {/* Dots — centered, below CTA */}
      <div className="absolute bottom-2 left-0 right-0 z-[2] flex items-center justify-center gap-0.5 px-4 sm:bottom-4">
        {banners.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setActive(i); setAnimKey((k) => k + 1); resetTimer(); }}
            className="flex cursor-pointer items-center justify-center px-2.5 py-3"
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === active ? "true" : undefined}
          >
            <span
              className={`block h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-7 bg-customer-primary" : "w-1.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CustomerHomePage() {
  const { cart, setOrderType, setOrderTypeModalOpen, tryAddToCart } = useCustomer();
  const { menuItems, categories } = useModuleData();
  const { link } = useRestaurantSlug();
  const { info } = useRestaurantInfo();
  const { content: cms } = useRestaurantCms();
  const homeCms = mergeCmsSection(DEFAULTS.home, cms.home);
  const router = useRouter();
  const [sizePickerItem, setSizePickerItem] = useState(null);

  const handleHomeAdd = useCallback(
    (item) => {
      if (itemHasSizes(item)) {
        setSizePickerItem(item);
        return;
      }
      tryAddToCart(buildSimpleCartLine(item));
    },
    [tryAddToCart]
  );

  const getInCart = useCallback(
    (itemId) => getMenuItemCartState(cart.lines, itemId),
    [cart.lines]
  );

  const orderTypes = homeCms.orderTypes?.length ? homeCms.orderTypes : [];
  const steps = homeCms.steps?.length ? homeCms.steps : [];
  const reviews = homeCms.reviews?.length ? homeCms.reviews : [];
  const orderH = pickSectionHeaders(cms, "orderTypes", {
    badge: "How You Dine",
    title: "Choose Your Order Style",
    subtitle: "Pick one — you can change it anytime before checkout.",
  });
  const featuredH = pickSectionHeaders(cms, "featured", {
    badge: "Chef's Pick",
    title: "Chef's Favorite",
    subtitle: "Handpicked by our chef — fresh, bold, and unforgettable.",
    actionLabel: "View All",
  });
  const menuH = pickSectionHeaders(cms, "menuPreview", {
    badge: "Explore",
    title: "Our Delicious Menu",
    subtitle: "Fresh ingredients, authentic flavors — crafted with love.",
    actionLabel: "View Full Menu",
  });
  const stepsH = pickSectionHeaders(cms, "steps", {
    badge: "Simple Process",
    title: "How It Works",
    subtitle: "From browsing to enjoying — quick and clear.",
  });
  const reviewsH = pickSectionHeaders(cms, "reviews", {
    badge: "Reviews",
    title: "Voices of Our Food Lovers",
    subtitle: "See why our guests keep coming back for more.",
  });
  const cta = homeCms.cta ?? {};

  const featured = menuItems.filter((m) => m.badge && m.status === "active").slice(0, 6);
  const heroDish = featured[0] ?? null;
  const hero = cms.hero ?? {};
  const heroImage = hero.imageUrl?.trim() || DEFAULT_HERO_IMAGE;
  const activeBanners = getActiveBanners(cms.banners);
  const heroThumbs =
    Array.isArray(hero.thumbnails) && hero.thumbnails.some((t) => t?.imageUrl?.trim())
      ? hero.thumbnails.filter((t) => t?.imageUrl?.trim()).slice(0, 3)
      : [];
  const quickPills =
    hero.quickPillsEnabled !== false && Array.isArray(hero.quickPills)
      ? hero.quickPills.filter((p) => p?.label?.trim() && p?.query?.trim())
      : [];

  const resolveHeroHref = (path) => {
    const p = path?.trim();
    if (!p) return null;
    if (p.startsWith("http")) return p;
    return link(p.startsWith("/") ? p : `/${p}`);
  };
  const primaryHref = resolveHeroHref(hero.ctaPrimaryLink);
  const secondaryHref = resolveHeroHref(hero.ctaSecondaryLink) || link("/order/table-booking");

  const [searchQuery, setSearchQuery] = useState("");
  const [previewCategory, setPreviewCategory] = useState("all");

  const handleOrderType = (type) => {
    setOrderType(type);
    router.push(link("/order/menu"));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(link(`/order/menu?q=${encodeURIComponent(q)}`));
  };

  // Menu preview — categories with items, max 8 items shown
  const activeMenuItems = useMemo(() => menuItems.filter((m) => m.status === "active"), [menuItems]);
  const previewCategories = useMemo(() => {
    const catIds = new Set(activeMenuItems.map((m) => m.categoryId));
    return categories.filter((c) => catIds.has(c.id));
  }, [categories, activeMenuItems]);
  const previewItems = useMemo(() => {
    const items = previewCategory === "all"
      ? activeMenuItems
      : activeMenuItems.filter((m) => m.categoryId === previewCategory);
    return items.slice(0, 8);
  }, [activeMenuItems, previewCategory]);

  return (
    <>
    <div className="pb-16">

      {cms.announcement?.enabled && cms.announcement?.text?.trim() && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 break-words px-4 py-2.5 text-center text-sm font-semibold"
          style={{
            backgroundColor: cms.announcement.bgColor || "var(--customer-primary)",
            color: cms.announcement.textColor || "#ffffff",
          }}
        >
          {cms.announcement.link?.trim() ? (
            <a
              href={
                cms.announcement.link.startsWith("http")
                  ? cms.announcement.link
                  : link(
                      cms.announcement.link.startsWith("/")
                        ? cms.announcement.link
                        : `/${cms.announcement.link}`
                    )
              }
              className="hover:underline underline-offset-2"
            >
              {cms.announcement.text}
              {cms.announcement.linkLabel?.trim() && (
                <span className="ml-2 underline">{cms.announcement.linkLabel}</span>
              )}
            </a>
          ) : (
            <span>
              {cms.announcement.text}
              {cms.announcement.linkLabel?.trim() && (
                <span className="ml-2 underline">{cms.announcement.linkLabel}</span>
              )}
            </span>
          )}
        </motion.div>
      )}

      {/* ══ HERO ══ */}
      <section className="overflow-hidden bg-[var(--customer-bg)]">
        <div className={`${customerClasses.container} px-4 sm:px-6 lg:px-8`}>
          <div className="grid min-h-[min(520px,85vh)] items-center gap-8 py-10 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">

            {/* ── Left: Text + Search ── */}
            <motion.div
              variants={customerMotion.heroEnter}
              initial="hidden"
              animate="show"
              className="flex flex-col"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-5 inline-flex w-fit items-center gap-2"
              >
                <span className={customerClasses.badge}>
                  <span className="flex size-4 items-center justify-center rounded-full gradient-primary">
                    <Flame className="size-2.5 text-[var(--customer-btn-primary-fg)]" />
                  </span>
                  {hero.badge || "Chef Crafted · Fresh · Premium"}
                </span>
              </motion.div>

              {/* Headline */}
              <h1 className={`${customerType.heroTitle} whitespace-pre-line`}>
                {hero.headline?.trim() ||
                  `Delicious food from ${info.name || "our kitchen"}`}
              </h1>

              <p className={`mt-4 max-w-md ${customerType.body}`}>
                {hero.subheadline ||
                  "Order, eat, repeat. Fresh ingredients, bold flavors — delivered to your door or ready at your table."}
              </p>

              {hero.searchEnabled !== false && (
                <motion.form
                  onSubmit={handleSearch}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`ct-hero-search mt-7 w-full max-w-md ${customerInteractive.inputWrap}`}
                >
                  <Search className={`size-4 shrink-0 ${customerInteractive.inputIcon}`} aria-hidden />
                  <input
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={hero.searchPlaceholder || "Search for dishes…"}
                    className={`${customerInteractive.input} min-w-0`}
                    aria-label="Search menu"
                    role="searchbox"
                  />
                  <motion.button
                    whileHover={customerMotion.hoverBtn}
                    whileTap={customerMotion.tapSm}
                    type="submit"
                    aria-label={hero.searchButtonLabel || "Search"}
                    className={`${customerClasses.btnPrimary} ct-hero-search__btn shrink-0 cursor-pointer text-xs`}
                  >
                    <ArrowRight className="size-4 sm:hidden" aria-hidden />
                    <span className="hidden sm:inline">{hero.searchButtonLabel || "Search"}</span>
                  </motion.button>
                </motion.form>
              )}

              {quickPills.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="mt-4 flex flex-wrap gap-2"
                >
                  {quickPills.map(({ label, query }) => (
                    <button
                      key={`${label}-${query}`}
                      type="button"
                      onClick={() => router.push(link(`/order/menu?q=${encodeURIComponent(query)}`))}
                      className={customerClasses.chip}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-8 flex flex-wrap gap-6"
              >
                {(cms.about?.stats?.length > 0
                  ? cms.about.stats.slice(0, 3).map((s) => ({ value: s.value, label: s.label }))
                  : [
                      { value: "50+",    label: "Menu Items" },
                      { value: "4.9 ★",  label: "Avg Rating" },
                      { value: "20 min", label: "Avg Prep Time" },
                    ]
                ).map(({ value, label }) => (
                  <div key={label} className="flex flex-col">
                    <span className={customerType.statValue}>{value}</span>
                    <span className={customerType.statLabel}>{label}</span>
                  </div>
                ))}
              </motion.div>

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {primaryHref ? (
                  <motion.div whileHover={customerMotion.hoverBtn} whileTap={customerMotion.tapSm}>
                    <Link href={primaryHref} className={`${customerClasses.btnPrimary} gap-2 px-7 py-3.5 text-sm`}>
                      {hero.ctaPrimaryLabel || "Order Now"} <ChevronRight className="size-4" />
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={customerMotion.hoverBtn}
                    whileTap={customerMotion.tapSm}
                    type="button"
                    onClick={() => setOrderTypeModalOpen(true)}
                    className={`${customerClasses.btnPrimary} cursor-pointer gap-2 px-7 py-3.5 text-sm`}
                  >
                    {hero.ctaPrimaryLabel || "Order Now"} <ChevronRight className="size-4" />
                  </motion.button>
                )}
                <motion.div whileHover={customerMotion.hoverBtn} whileTap={customerMotion.tapSm}>
                  <Link href={secondaryHref} className={`${customerClasses.btnOutlineDark} gap-2 px-7 py-3.5 text-sm`}>
                    <CalendarClock className="size-4 text-customer-primary" />
                    {hero.ctaSecondaryLabel || "Book a Table"}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* ── Right: Food image collage ── */}
            <motion.div
              variants={customerMotion.heroMedia}
              initial="hidden"
              animate="show"
              className="relative mt-6 lg:mt-0"
            >
              {/* Main large image */}
              <div className="ct-media-zoom relative overflow-hidden rounded-3xl">
                <img
                  src={heroImage}
                  alt={heroDish?.name || info.name || "Delicious food"}
                  className="h-[220px] w-full object-cover sm:h-[280px] lg:h-[380px]"
                  onError={(e) => { e.target.src = DEFAULT_HERO_IMAGE; }}
                />
                <div className={customerOverlay.gradientBottomSoft} />

                {hero.showMenuDishOverlay && heroDish && (
                  <div className="absolute bottom-4 left-4 right-4 z-[1]">
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`font-poppins text-lg font-bold ${customerOverlay.title}`}>{heroDish.name}</p>
                        <p className={`text-sm ${customerOverlay.subtitle}`}>{heroDish.categoryName}</p>
                      </div>
                      <span className={`shrink-0 px-3 py-1.5 text-sm ${customerOverlay.pricePill}`}>
                        {formatCustomerMoney(heroDish.price ?? 0)}
                      </span>
                    </div>
                  </div>
                )}

                {hero.overlayBadge?.trim() && (
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-4 top-4 z-[1] flex items-center gap-2 rounded-2xl border border-customer-border bg-[var(--customer-card)]/95 px-3 py-2 backdrop-blur-sm"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full gradient-primary">
                      <Award className="size-3.5 text-white" />
                    </span>
                    <span className="text-xs font-bold text-customer-text">{hero.overlayBadge}</span>
                  </motion.div>
                )}

                {hero.floatingCard?.enabled !== false &&
                  (hero.floatingCard?.title?.trim() || hero.floatingCard?.subtitle?.trim()) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                    className="absolute bottom-3 right-3 z-[2] flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-2xl border border-customer-border ct-surface-card px-3 py-2.5 shadow-lg sm:bottom-4 sm:right-4 sm:max-w-none sm:px-4 sm:py-3"
                  >
                    <div className="flex -space-x-1.5">
                      {["A", "R", "P"].map((initial, i) => (
                        <span key={i} className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--customer-card)] gradient-primary text-[10px] font-bold text-[var(--customer-btn-primary-fg)]">{initial}</span>
                      ))}
                    </div>
                    <div>
                      {hero.floatingCard?.title?.trim() && (
                        <p className="text-xs font-bold text-customer-text">{hero.floatingCard.title}</p>
                      )}
                      {hero.floatingCard?.subtitle?.trim() && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`size-3 ${customerClasses.textSuccess}`} />
                          <span className={`text-[10px] font-semibold ${customerClasses.textSuccess}`}>
                            {hero.floatingCard.subtitle}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {heroThumbs.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {heroThumbs.map(({ label, imageUrl }, i) => (
                    <div key={`${label}-${i}`} className="ct-media-zoom group relative overflow-hidden rounded-2xl">
                      <img
                        src={imageUrl.trim()}
                        alt={label || "Food"}
                        className="h-20 w-full object-cover sm:h-24"
                        onError={(e) => { e.target.src = DEFAULT_HERO_IMAGE; }}
                      />
                      <div className={customerOverlay.thumb} />
                      {label?.trim() && (
                        <span className={`absolute bottom-2 left-2 z-[1] text-xs font-bold ${customerOverlay.title}`}>
                          {label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ PROMO BANNER SLIDER ══ */}
      {activeBanners.length > 0 && (
        <section className={`${customerSectionBg.white} ${customerClasses.sectionPad}`}>
          <div className={customerClasses.container}>
            <PromoBannerSlider banners={activeBanners} link={link} />
          </div>
        </section>
      )}

      {/* ══ ORDER TYPES ══ */}
      {orderTypes.length > 0 && (
      <section className={`${customerSectionBg.warm} ${customerClasses.sectionPad}`}>
        <div className={customerClasses.container}>
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <CustomerSectionHeader animated={false} {...orderH} />
            </motion.div>
            <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-3">
              {orderTypes.map((type) => {
                const ui = ORDER_TYPE_UI[type.id];
                const Icon = ui?.Icon ?? Store;
                return (
                  <motion.button
                    key={type.id}
                    variants={fadeUp}
                    whileHover={customerMotion.cardHover}
                    whileTap={customerMotion.tap}
                    type="button"
                    onClick={() => handleOrderType(type.id)}
                    className={`${customerClasses.choiceCard} group`}
                  >
                    <div className={`mb-5 ${customerClasses.iconBoxLg}`}>
                      <Icon className="size-8 text-white" />
                    </div>
                    <h3 className={customerType.cardTitle}>{type.title}</h3>
                    <p className={`mt-2 flex-1 ${customerType.bodySm}`}>{type.description}</p>
                    <div className={`${customerInteractive.linkArrow} mt-5`}>
                      Start ordering <ChevronRight className="size-4" />
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
      )}

      {/* ══ CATEGORIES ══ */}
      <CategoryBrowseSection categories={categories} menuItems={menuItems} link={link} cms={cms} />

      {/* ══ FEATURED DISHES ══ */}
      {featured.length > 0 && (
        <section className={`${customerSectionBg.warm} ${customerClasses.sectionPad}`}>
          <div className={customerClasses.container}>
            <AnimatedSection>
              <motion.div variants={fadeUp}>
                <CustomerSectionHeader
                  animated={false}
                  align="split"
                  badge={featuredH.badge}
                  title={featuredH.title}
                  subtitle={featuredH.subtitle}
                  action={
                    <Link href={link("/order/menu")} className={customerClasses.btnSecondary}>
                      {featuredH.actionLabel || "View All"} <ArrowRight className="size-4" />
                    </Link>
                  }
                />
              </motion.div>
              <motion.div variants={stagger} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    inCart={getInCart(item.id)}
                    onAdd={handleHomeAdd}
                    detailHref={link(`/order/menu/${item.id}`)}
                    motionProps={{ variants: fadeUp }}
                  />
                ))}
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ══ MENU PREVIEW ══ */}
      {previewItems.length > 0 && (
        <section className={`${customerSectionBg.white} ${customerClasses.sectionPad}`}>
          <div className={customerClasses.container}>
            <AnimatedSection>
              <motion.div variants={fadeUp}>
                <CustomerSectionHeader
                  animated={false}
                  align="split"
                  badge={menuH.badge}
                  title={menuH.title}
                  subtitle={menuH.subtitle}
                  action={
                    <Link href={link("/order/menu")} className={customerClasses.btnSecondary}>
                      {menuH.actionLabel || "View Full Menu"} <ArrowRight className="size-4" />
                    </Link>
                  }
                />
              </motion.div>
              <motion.div variants={fadeUp} className="mb-7 flex min-w-0 flex-wrap gap-2">
                {[{ id: "all", name: "All" }, ...previewCategories].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={(e) => {
                      setPreviewCategory(c.id);
                      e.currentTarget.blur();
                    }}
                    className={previewCategory === c.id ? customerClasses.chipActive : customerClasses.chip}
                  >
                    {c.name}
                  </button>
                ))}
              </motion.div>
              <motion.div key={previewCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {previewItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    inCart={getInCart(item.id)}
                    onAdd={handleHomeAdd}
                    detailHref={link(`/order/menu/${item.id}`)}
                  />
                ))}
              </motion.div>
              <motion.div variants={fadeUp} className="mt-10 text-center">
                <Link href={link("/order/menu")} className={customerClasses.btnOutlineDark}>
                  View All Items <ArrowRight className="size-4 text-customer-primary" />
                </Link>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      <section className={`${customerSectionBg.warm} ${customerClasses.sectionPad}`}>
        <div className={customerClasses.container}>
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <CustomerSectionHeader animated={false} {...stepsH} />
            </motion.div>
            <motion.div variants={stagger} className={customerLayout.stepsGrid}>
              {steps.map(({ n, title, text, icon }) => {
                const Icon = STEP_ICON_MAP[icon] ?? LayoutGrid;
                return (
                  <motion.div
                    key={n}
                    variants={fadeUp}
                    whileHover={customerMotion.cardHoverSm}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="ct-step-card h-full min-w-0"
                  >
                    <div className="ct-step-card__head">
                      <div className="ct-step-card__icon" aria-hidden>
                        <Icon className="size-5" />
                      </div>
                      <span className="ct-step-card__num">{n}</span>
                    </div>
                    <h3 className="ct-step-card__title">{title}</h3>
                    <p className="ct-step-card__text">{text}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ══ REVIEWS ══ */}
      {reviews.length > 0 && (
      <section className={`${customerSectionBg.white} ${customerClasses.sectionPad}`}>
        <div className={customerClasses.container}>
          <AnimatedSection>
            <motion.div variants={fadeUp}>
              <CustomerSectionHeader animated={false} {...reviewsH} />
            </motion.div>
            <motion.div variants={stagger} className="grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <motion.blockquote
                  key={r.name}
                  variants={fadeUp}
                  whileHover={customerMotion.cardHoverSm}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className="ct-review-card"
                >
                  <div className="ct-review-card__stars" aria-hidden>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="size-4" />
                    ))}
                  </div>
                  <p className="ct-review-card__quote">&ldquo;{r.quote}&rdquo;</p>
                  <div className="ct-review-card__author">
                    <div className="ct-review-card__avatar" aria-hidden>
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <p className="ct-review-card__name">{r.name}</p>
                      <p className="ct-review-card__role">{r.role}</p>
                    </div>
                  </div>
                </motion.blockquote>
              ))}
            </motion.div>
          </AnimatedSection>
        </div>
      </section>
      )}

      {/* ══ CTA BANNER ══ */}
      <section className={`${customerSectionBg.warm} ${customerClasses.sectionPad}`}>
        <div className={customerClasses.containerNarrow}>
          <AnimatedSection>
            <motion.div variants={fadeUp}
              className="relative overflow-hidden rounded-3xl gradient-primary px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-14 md:flex md:items-center md:justify-between md:text-left">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-16 -left-16 size-56 rounded-full bg-white/10 blur-3xl" />
              </div>
              <div className="relative">
                <h3 className={`${customerOverlay.title} font-poppins text-2xl font-black sm:text-3xl lg:text-4xl`}>
                  {cta.title?.trim() || "Ready to Order?"}
                </h3>
                <p className={`mt-2 text-sm ${customerOverlay.subtitle}`}>
                  {cta.subtitle?.trim() || "Fresh food, seamless checkout, and real-time updates you can trust."}
                </p>
              </div>
              <div className="relative mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center md:mt-0 md:shrink-0">
                {cta.primaryLink?.trim() && !cta.primaryOpensModal ? (
                  <Link
                    href={
                      cta.primaryLink.startsWith("http")
                        ? cta.primaryLink
                        : link(cta.primaryLink.startsWith("/") ? cta.primaryLink : `/${cta.primaryLink}`)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-customer-primary transition-all hover:scale-105"
                  >
                    {cta.primaryLabel?.trim() || "Order Now"} <ChevronRight className="size-4" />
                  </Link>
                ) : (
                  <motion.button
                    whileHover={customerMotion.hoverBtn}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setOrderTypeModalOpen(true)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-customer-primary transition-all"
                  >
                    {cta.primaryLabel?.trim() || "Order Now"} <ChevronRight className="size-4" />
                  </motion.button>
                )}
                <Link
                  href={
                    cta.secondaryLink?.trim()
                      ? cta.secondaryLink.startsWith("http")
                        ? cta.secondaryLink
                        : link(
                            cta.secondaryLink.startsWith("/") ? cta.secondaryLink : `/${cta.secondaryLink}`
                          )
                      : link("/order/table-booking")
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/15 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/25"
                >
                  <CalendarClock className="size-4" /> {cta.secondaryLabel?.trim() || "Book Table"}
                </Link>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

    </div>

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
    </>
  );
}
