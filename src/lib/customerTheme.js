/**
 * Reusable customer-site layout tokens — all use CSS variables from CustomerThemeProvider.
 * @see src/lib/customerDesignSystem.js · src/app/globals.css (.ct-*)
 */

export {
  customerMotion,
  customerType,
  customerLayout,
  customerInteractive,
  customerOverlay,
  customerPage,
} from "@/lib/customerDesignSystem";

export const customerSectionBg = {
  white: "bg-[var(--customer-bg)]",
  /** Subtle gray band — use only to separate long white sections */
  warm: "bg-[var(--customer-section-alt)]",
};

export const customerClasses = {
  sectionPad: "ct-section",
  container: "mx-auto max-w-7xl w-full",
  containerNarrow: "mx-auto max-w-5xl w-full",

  badge: "ct-badge",
  title: "ct-title",
  subtitle: "ct-subtitle",

  card: "ct-card",
  cardInner: "ct-card-inner",

  btnPrimary: "ct-btn ct-btn-primary",
  btnSecondary: "ct-btn ct-btn-secondary",
  btnOutlineDark: "ct-btn ct-btn-outline",
  btnPrimaryLg: "ct-btn ct-btn-primary min-h-[52px] w-full justify-center",

  alertError: "ct-alert ct-alert-error",
  alertWarning: "ct-alert ct-alert-warning",
  alertSuccess: "ct-alert ct-alert-success",
  alertInfo: "ct-alert ct-alert-info",
  bannerWarning: "ct-banner-warning",
  bannerSuccess: "ct-banner-success",

  chip: "ct-chip",
  chipActive: "ct-chip ct-chip-active",

  iconBox: "ct-icon-box",
  iconBoxLg: "ct-icon-box ct-icon-box-lg",
  iconTintPrimary: "ct-icon-tint-primary",
  iconTintSuccess: "ct-icon-tint-success",
  iconTintWarning: "ct-icon-tint-warning",
  iconTintInfo: "ct-icon-tint-info",
  iconRingSuccess: "ct-icon-ring-success",
  textSuccess: "ct-text-success",
  textDanger: "ct-text-danger",
  btnDangerGhost: "ct-btn-danger-ghost",
  statusDotOpen: "ct-status-dot ct-status-dot--open",
  statusDotClosed: "ct-status-dot ct-status-dot--closed",

  panel: "ct-panel",
  choiceCard: "ct-choice-card",
  successHero: "ct-success-hero",

  textPrimary: "text-[var(--customer-primary)]",
  textMuted: "text-[var(--customer-muted)]",
  borderTheme: "border-[var(--customer-border)]",
  bgWarm: "bg-[var(--customer-section-alt)]",
  surface: "bg-[var(--customer-card)]",
  elevated: "bg-[var(--customer-elevated)]",
  pageBg: "bg-[var(--customer-bg)]",

  /** Form inputs — use on menu/contact/checkout/booking */
  field: "ct-field",
  fieldWrap: "ct-field-wrap",
  fieldWrapPadLeft: "ct-field-wrap ct-field-wrap--pad-left",
  fieldWrapPadRight: "ct-field-wrap ct-field-wrap--pad-right",
  selectChip: "ct-select-chip",
};

/** @deprecated use CSS variables */
export const customerTheme = {
  primary: "var(--customer-primary)",
  cream: "var(--customer-cream)",
  border: "var(--customer-border)",
  text: "var(--customer-text)",
  muted: "var(--customer-muted)",
};
