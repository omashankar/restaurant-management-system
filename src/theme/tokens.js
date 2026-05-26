import { DEFAULT_CUSTOMER_THEME } from "@/lib/customerThemeDefaults";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { clampHex, generatePalette } from "@/theme/palette";
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/theme/constants";

export function resolveThemeInput(stored) {
  return mergeCmsSection(DEFAULT_CUSTOMER_THEME, stored);
}

/**
 * Build CSS custom properties object for `.customer-theme`.
 * @param {object} stored - CMS theme section
 * @param {"light"|"dark"|null} modeOverride - user preference from localStorage
 */
export function buildThemeCssVars(stored, modeOverride = null) {
  const t = resolveThemeInput(stored);
  const primary = clampHex(t.primaryColor, DEFAULT_PRIMARY);
  const secondary = clampHex(t.secondaryColor, DEFAULT_SECONDARY);
  const mode =
    modeOverride === "dark" || modeOverride === "light"
      ? modeOverride
      : t.colorMode === "dark"
        ? "dark"
        : "light";
  const font =
    String(t.fontFamily ?? "").trim() || DEFAULT_CUSTOMER_THEME.fontFamily;
  const palette = generatePalette(primary, secondary, mode);

  const headerBg = t.header?.colors?.background?.trim();
  const headerFont = t.header?.colors?.font?.trim();
  const footerBg = t.footer?.colors?.background?.trim();

  return {
    "--customer-primary": palette.primary,
    "--customer-primary-hover": palette.primaryHover,
    "--customer-primary-active": palette.primaryActive,
    "--customer-primary-soft": palette.primarySoft,
    "--customer-primary-muted": palette.primaryMuted,
    "--customer-primary-border": palette.primaryBorder,
    "--customer-primary-shadow": palette.primaryShadow,
    "--customer-primary-fg": palette.primaryFg,

    "--customer-secondary": palette.secondary,
    "--customer-secondary-hover": palette.secondaryHover,
    "--customer-secondary-soft": palette.secondarySoft,

    "--customer-cream": palette.cream,
    "--customer-border": palette.border,
    "--customer-border-strong": palette.borderStrong,
    "--customer-text": palette.text,
    "--customer-muted": palette.muted,
    "--customer-bg": palette.bg,
    "--customer-surface": palette.surface,
    "--customer-card": palette.card,
    "--customer-card-hover": palette.cardHover,
    "--customer-ring": palette.ring,

    "--customer-nav-bg": headerBg || palette.navBg,
    "--customer-nav-text": headerFont || palette.navText,
    "--customer-nav-muted": t.header?.colors?.icon?.trim() || palette.navMuted,

    "--customer-footer-bg": footerBg || (mode === "dark" ? "#111827" : "#111827"),
    "--customer-footer-text": t.footer?.colors?.font?.trim() || "#ffffff",
    "--customer-footer-muted": "rgba(255, 255, 255, 0.72)",
    "--customer-footer-subtle": "rgba(255, 255, 255, 0.55)",

    "--customer-sidebar-bg": palette.sidebarBg,
    "--customer-sidebar-border": palette.sidebarBorder,
    "--customer-sidebar-active": palette.sidebarActive,
    "--customer-sidebar-active-text": palette.sidebarActiveText,

    "--customer-btn-primary-bg": palette.btnPrimaryBg,
    "--customer-btn-primary-fg": palette.btnPrimaryFg,
    "--customer-btn-secondary-bg": palette.btnSecondaryBg,
    "--customer-btn-secondary-fg": palette.btnSecondaryFg,
    "--customer-btn-secondary-border": palette.btnSecondaryBorder,

    "--customer-font": font,
    "--customer-mode": mode,
  };
}

export function themeRootClassName(mode) {
  const isDark = mode === "dark";
  return isDark ? "customer-theme customer-dark" : "customer-theme";
}

/** Serializable snapshot for localStorage */
export function themeSnapshot(stored, mode) {
  const t = resolveThemeInput(stored);
  return {
    primaryColor: clampHex(t.primaryColor, DEFAULT_PRIMARY),
    secondaryColor: clampHex(t.secondaryColor, DEFAULT_SECONDARY),
    colorMode: mode === "dark" ? "dark" : "light",
    fontFamily: t.fontFamily ?? DEFAULT_CUSTOMER_THEME.fontFamily,
    updatedAt: Date.now(),
  };
}
