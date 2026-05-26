import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/theme/constants";

const HEX6 = /^#[0-9A-Fa-f]{6}$/;

export function clampHex(hex, fallback) {
  const h = String(hex ?? "").trim();
  return HEX6.test(h) ? h : fallback;
}

export function hexToRgb(hex) {
  const h = clampHex(hex, "#000000").slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[c(r), c(g), c(b)].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Mix two hex colors; weight 0 = a, 1 = b */
export function mixHex(a, b, weight) {
  const w = Math.max(0, Math.min(1, weight));
  const c1 = hexToRgb(a);
  const c2 = hexToRgb(b);
  return rgbToHex(
    c1.r + (c2.r - c1.r) * w,
    c1.g + (c2.g - c1.g) * w,
    c1.b + (c2.b - c1.b) * w
  );
}

export function lighten(hex, amount) {
  return mixHex(hex, "#ffffff", Math.abs(amount));
}

export function darken(hex, amount) {
  return mixHex(hex, "#000000", Math.abs(amount));
}

/** Relative luminance 0–1 */
export function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastText(bgHex) {
  return luminance(bgHex) > 0.55 ? "#111827" : "#ffffff";
}

export function alphaHex(hex, opacity) {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.max(0, Math.min(1, opacity));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Full semantic palette from primary + secondary + color mode.
 * @param {string} primary
 * @param {string} secondary
 * @param {"light"|"dark"} mode
 */
export function generatePalette(
  primary = DEFAULT_PRIMARY,
  secondary = DEFAULT_SECONDARY,
  mode = "light"
) {
  const p = clampHex(primary, DEFAULT_PRIMARY);
  const s = clampHex(secondary, DEFAULT_SECONDARY);
  const isDark = mode === "dark";

  const bg = isDark ? "#0f172a" : "#ffffff";
  const surface = isDark ? "#1e293b" : "#ffffff";
  const cream = isDark ? mixHex(surface, p, 0.08) : mixHex("#ffffff", p, 0.04);
  const border = isDark ? mixHex(surface, p, 0.22) : mixHex("#ffffff", p, 0.78);
  const text = isDark ? "#f1f5f9" : "#111827";
  const muted = isDark ? "#94a3b8" : "#6b7280";
  const card = isDark ? "#1e293b" : "#ffffff";

  return {
    primary: p,
    primaryHover: isDark ? lighten(p, 0.1) : darken(p, 0.08),
    primaryActive: isDark ? lighten(p, 0.16) : darken(p, 0.14),
    primarySoft: alphaHex(p, isDark ? 0.18 : 0.1),
    primaryMuted: alphaHex(p, isDark ? 0.28 : 0.2),
    primaryBorder: alphaHex(p, isDark ? 0.35 : 0.28),
    primaryShadow: alphaHex(p, isDark ? 0.35 : 0.22),
    primaryFg: contrastText(p),

    secondary: s,
    secondaryHover: isDark ? lighten(s, 0.1) : darken(s, 0.08),
    secondarySoft: alphaHex(s, isDark ? 0.15 : 0.1),

    bg,
    surface,
    cream,
    card,
    cardHover: isDark ? lighten(surface, 0.06) : mixHex(card, p, 0.03),
    border,
    borderStrong: isDark ? mixHex(surface, p, 0.35) : mixHex("#ffffff", p, 0.65),
    text,
    muted,
    ring: alphaHex(p, 0.45),

    navBg: isDark ? "#0f172a" : "#ffffff",
    navText: isDark ? "#f1f5f9" : "#333333",
    navMuted: isDark ? "#94a3b8" : "#9c9c9c",

    sidebarBg: isDark ? "#1e293b" : cream,
    sidebarBorder: border,
    sidebarActive: alphaHex(p, isDark ? 0.22 : 0.12),
    sidebarActiveText: p,

    btnPrimaryBg: p,
    btnPrimaryFg: contrastText(p),
    btnSecondaryBg: isDark ? surface : "#ffffff",
    btnSecondaryFg: p,
    btnSecondaryBorder: border,

    mode,
  };
}
