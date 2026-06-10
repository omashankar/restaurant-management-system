import { DEFAULT_CUSTOMER_THEME } from "@/lib/customerThemeDefaults";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { resolveCustomerFontStack } from "@/theme/customerFonts";
import { clampHex, generatePalette, luminance } from "@/theme/palette";
import { DEFAULT_PRIMARY } from "@/theme/constants";

export function resolveThemeInput(stored) {
  const t = mergeCmsSection(DEFAULT_CUSTOMER_THEME, stored);
  const primary = clampHex(t.primaryColor, DEFAULT_PRIMARY);
  return { ...t, primaryColor: primary, secondaryColor: primary };
}

/**
 * Build CSS custom properties object for `.customer-theme`.
 * @param {object} stored - CMS theme section
 * @param {"light"|"dark"|null} modeOverride - user preference from localStorage
 */
export function buildThemeCssVars(stored, modeOverride = null) {
  const t = resolveThemeInput(stored);
  const primary = clampHex(t.primaryColor, DEFAULT_PRIMARY);
  const mode =
    modeOverride === "dark" || modeOverride === "light"
      ? modeOverride
      : t.colorMode === "dark"
        ? "dark"
        : "light";
  const font = resolveCustomerFontStack(t.fontFamily);
  const palette = generatePalette(primary, mode);

  const headerBg = t.header?.colors?.background?.trim();
  const headerFont = t.header?.colors?.font?.trim();
  const headerIconCms = t.header?.colors?.icon?.trim();
  const footerBgCms = t.footer?.colors?.background?.trim();
  const footerFontCms = t.footer?.colors?.font?.trim();
  const isDark = mode === "dark";

  return {
    "--customer-primary": palette.primary,
    "--customer-primary-hover": palette.primaryHover,
    "--customer-primary-active": palette.primaryActive,
    "--customer-primary-soft": palette.primarySoft,
    "--customer-primary-muted": palette.primaryMuted,
    "--customer-primary-border": palette.primaryBorder,
    "--customer-primary-shadow": palette.primaryShadow,
    "--customer-primary-fg": palette.primaryFg,

    "--customer-secondary": palette.primaryHover,
    "--customer-secondary-hover": palette.primaryActive,
    "--customer-secondary-soft": palette.primarySoft,

    "--customer-cream": palette.cream,
    "--customer-section-alt": palette.sectionAlt,
    "--customer-elevated": palette.elevated,
    "--customer-border": palette.border,
    "--customer-border-strong": palette.borderStrong,
    "--customer-text": palette.text,
    "--customer-muted": palette.muted,
    "--customer-bg": palette.bg,
    "--customer-surface": palette.surface,
    "--customer-card": palette.card,
    "--customer-card-hover": palette.cardHover,
    "--customer-ring": palette.ring,

    "--customer-nav-bg": isDark ? palette.navBg : headerBg || palette.navBg,
    "--customer-nav-text": isDark ? palette.navText : headerFont || palette.navText,
    "--customer-nav-muted": isDark ? palette.navMuted : headerIconCms || palette.navMuted,

    ...(() => {
      const footerBg = isDark ? palette.footerBg : footerBgCms || palette.footerBg;
      const footerIsDark = luminance(footerBg) <= 0.55;
      return {
        "--customer-footer-bg": footerBg,
        "--customer-footer-text": isDark
          ? palette.footerText
          : footerFontCms || (footerIsDark ? "#ffffff" : palette.footerText),
        "--customer-footer-muted": footerIsDark
          ? isDark
            ? palette.footerMuted
            : "rgba(255, 255, 255, 0.72)"
          : palette.footerMuted,
        "--customer-footer-subtle": footerIsDark
          ? isDark
            ? palette.footerSubtle
            : "rgba(255, 255, 255, 0.55)"
          : palette.footerSubtle,
        "--customer-footer-border": footerIsDark
          ? isDark
            ? palette.footerBorder
            : "rgba(255, 255, 255, 0.14)"
          : palette.footerBorder,
      };
    })(),

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

/** Serializable snapshot for localStorage (colors + font only; not user mode preference). */
export function themeSnapshot(stored) {
  const t = resolveThemeInput(stored);
  const primary = clampHex(t.primaryColor, DEFAULT_PRIMARY);
  return {
    primaryColor: primary,
    secondaryColor: primary,
    fontFamily: t.fontFamily ?? DEFAULT_CUSTOMER_THEME.fontFamily,
    updatedAt: Date.now(),
  };
}
