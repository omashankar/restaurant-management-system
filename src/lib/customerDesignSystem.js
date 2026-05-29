/**
 * Customer site design system — typography, spacing, motion (pairs with globals.css .ct-*).
 */

/** Framer Motion — use across sections for consistency */
export const customerMotion = {
  fadeUp: {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  },
  fadeUpSm: {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
  stagger: {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  },
  heroEnter: {
    hidden: { opacity: 0, x: -24 },
    show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: "easeOut" } },
  },
  heroMedia: {
    hidden: { opacity: 0, x: 24 },
    show: { opacity: 1, x: 0, transition: { duration: 0.55, delay: 0.12, ease: "easeOut" } },
  },
  cardHover: { y: -6, transition: { type: "spring", stiffness: 400, damping: 28 } },
  cardHoverSm: { y: -4, transition: { type: "spring", stiffness: 400, damping: 28 } },
  tap: { scale: 0.98 },
  tapSm: { scale: 0.97 },
};

/** Typography + layout class names (globals.css) */
export const customerType = {
  heroTitle: "ct-hero-title",
  sectionTitle: "ct-title",
  sectionSubtitle: "ct-subtitle",
  cardTitle: "ct-heading-3",
  cardTitleSm: "ct-heading-4",
  body: "ct-body",
  bodySm: "ct-body-sm",
  caption: "ct-caption",
  overline: "ct-overline",
  statValue: "ct-stat-value",
  statLabel: "ct-stat-label",
};

export const customerLayout = {
  section: "ct-section",
  sectionInner: "ct-section-inner",
  stackSm: "flex flex-col gap-4 sm:gap-5",
  stackMd: "flex flex-col gap-5 sm:gap-6 lg:gap-8",
  gridCards3: "grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3",
  gridCards4: "grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4",
  horizontalScroll: "ct-scroll-row",
};

/** Page-level shells (menu, cart, checkout, contact) */
export const customerPage = {
  shell: "ct-page-shell",
  header: "ct-page-header",
  headerInner: "ct-page-header-inner mx-auto max-w-4xl px-4 py-8 text-center sm:px-6 sm:py-10",
  headerInnerLeft: "ct-page-header-inner mx-auto max-w-2xl px-4 py-8 sm:px-6",
  narrow: "mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8",
  wide: "mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8",
  surface: "ct-surface-card",
  label: "ct-label",
  emptyIcon: "ct-empty-icon",
};

export const customerInteractive = {
  inputWrap: "ct-input-wrap",
  inputWrapStack: "ct-input-wrap ct-input-wrap--stack-sm",
  input: "ct-input",
  inputIcon: "ct-input-icon",
  field: "ct-field",
  fieldWrap: "ct-field-wrap",
  fieldWrapPadLeft: "ct-field-wrap ct-field-wrap--pad-left",
  fieldWrapPadRight: "ct-field-wrap ct-field-wrap--pad-right",
  fieldWrapPrefix: "ct-field-wrap ct-field-wrap--prefix",
  linkArrow: "ct-link-arrow",
  mediaZoom: "ct-media-zoom",
  cardMotion: "ct-card ct-card-motion ct-card-hover-shadow",
  cardStatic: "ct-card",
  cardLiftCss: "ct-card transition-[transform,box-shadow] duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_12px_36px_var(--customer-primary-shadow)]",
  pillScroll: "ct-pill-scroll",
};

/** Text on dark image overlays */
export const customerOverlay = {
  gradientBottom: "ct-overlay-gradient-bottom",
  gradientBottomSoft: "ct-overlay-gradient-bottom-soft",
  gradientPromo: "ct-overlay-gradient-promo",
  gradientPromoVignette: "ct-overlay-gradient-promo-vignette",
  thumb: "ct-overlay-thumb",
  title: "ct-overlay-title",
  subtitle: "ct-overlay-subtitle",
  caption: "ct-overlay-caption",
  pricePill: "ct-price-pill",
  glassPill: "ct-glass-pill",
};
