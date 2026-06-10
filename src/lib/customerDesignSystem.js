/**
 * Customer site design system — typography, spacing, motion (pairs with globals.css .ct-*).
 */

const springLift = { type: "spring", stiffness: 420, damping: 30 };
const springTap = { type: "spring", stiffness: 500, damping: 32 };

/** Framer Motion — use across sections for consistency */
export const customerMotion = {
  fadeUp: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
  },
  fadeUpSm: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  },
  stagger: {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
  },
  heroEnter: {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  },
  heroMedia: {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] } },
  },
  /** Card lift on hover — prefer over CSS translate on motion cards */
  cardHover: { y: -3, transition: springLift },
  cardHoverSm: { y: -2, transition: springLift },
  /** Buttons / pills */
  hoverBtn: { scale: 1.02, transition: springTap },
  hoverNudge: { y: -1, transition: springLift },
  tap: { scale: 0.98, transition: springTap },
  tapSm: { scale: 0.97, transition: springTap },
  springLift,
  springTap,
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
  stepsGrid: "ct-steps-grid",
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
  cardLiftCss:
    "ct-card ct-card-motion transition-[transform,border-color] duration-300 ease-out group-hover:-translate-y-1 group-hover:border-[var(--customer-primary-border)]",
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
