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
  warm: "bg-[var(--customer-cream)]",
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

  chip: "ct-chip",
  chipActive: "ct-chip ct-chip-active",

  iconBox: "ct-icon-box",
  iconBoxLg: "ct-icon-box ct-icon-box-lg",

  panel: "ct-panel",

  textPrimary: "text-[var(--customer-primary)]",
  textMuted: "text-[var(--customer-muted)]",
  borderTheme: "border-[var(--customer-border)]",
  bgWarm: "bg-[var(--customer-cream)]",

  /** Form inputs — use on menu/contact/checkout/booking */
  field: "ct-field",
  fieldWrap: "ct-field-wrap",
  fieldWrapPadLeft: "ct-field-wrap ct-field-wrap--pad-left",
  fieldWrapPadRight: "ct-field-wrap ct-field-wrap--pad-right",
};

/** @deprecated use CSS variables */
export const customerTheme = {
  primary: "var(--customer-primary)",
  cream: "var(--customer-cream)",
  border: "var(--customer-border)",
  text: "var(--customer-text)",
  muted: "var(--customer-muted)",
};
