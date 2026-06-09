import { DEFAULT_PRIMARY } from "@/theme/constants";

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
 * Semantic palette — light is clean & airy; dark is one neutral stack with brand accents only.
 */
/** Brand palette from a single primary color (no separate secondary accent). */
export function generatePalette(primary = DEFAULT_PRIMARY, mode = "light") {
  const p = clampHex(primary, DEFAULT_PRIMARY);
  const isDark = mode === "dark";

  if (!isDark) {
    const bg = "#ffffff";
    const sectionAlt = "#f4f4f5";
    const card = "#ffffff";
    const surface = card;
    const cream = "#fafafa";
    const elevated = "#ffffff";
    const border = mixHex("#e4e4e7", p, 0.03);
    const borderStrong = "#d4d4d8";

    return {
      primary: p,
      primaryHover: darken(p, 0.08),
      primaryActive: darken(p, 0.14),
      primarySoft: alphaHex(p, 0.09),
      primaryMuted: alphaHex(p, 0.16),
      primaryBorder: alphaHex(p, 0.22),
      primaryShadow: alphaHex(p, 0.18),
      primaryFg: contrastText(p),

      secondary: darken(p, 0.08),
      secondaryHover: darken(p, 0.14),
      secondarySoft: alphaHex(p, 0.09),

      bg,
      surface,
      cream,
      sectionAlt,
      elevated,
      card,
      cardHover: "#fafafa",
      border,
      borderStrong,
      text: "#1c1917",
      muted: "#78716c",
      ring: alphaHex(p, 0.35),

      navBg: "#ffffff",
      navText: "#292524",
      navMuted: "#a8a29e",
      footerBg: "#ffffff",
      footerText: "#1c1917",
      footerBorder: mixHex("#e4e4e7", p, 0.04),
      footerMuted: "#78716c",
      footerSubtle: "#a1a1aa",

      sidebarBg: cream,
      sidebarBorder: border,
      sidebarActive: alphaHex(p, 0.1),
      sidebarActiveText: p,

      btnPrimaryBg: p,
      btnPrimaryFg: contrastText(p),
      btnSecondaryBg: card,
      btnSecondaryFg: p,
      btnSecondaryBorder: border,

      mode,
    };
  }

  const bg = "#09090b";
  const card = "#18181b";
  const sectionAlt = mixHex(bg, card, 0.45);
  const surface = card;
  const cream = mixHex(card, "#ffffff", 0.06);
  const elevated = "#27272a";
  const border = alphaHex("#ffffff", 0.1);
  const borderStrong = alphaHex("#ffffff", 0.16);
  const text = "#fafafa";
  const muted = "#a1a1aa";
  const footerBg = mixHex(bg, card, 0.55);
  const footerBorder = alphaHex("#ffffff", 0.1);
  const footerText = text;
  const footerMuted = "rgba(255, 255, 255, 0.68)";
  const footerSubtle = "rgba(255, 255, 255, 0.5)";

  return {
    primary: p,
    primaryHover: lighten(p, 0.08),
    primaryActive: lighten(p, 0.14),
    primarySoft: alphaHex(p, 0.12),
    primaryMuted: alphaHex(p, 0.18),
    primaryBorder: alphaHex(p, 0.28),
    primaryShadow: alphaHex(p, 0.22),
    primaryFg: contrastText(p),

    secondary: lighten(p, 0.08),
    secondaryHover: lighten(p, 0.14),
    secondarySoft: alphaHex(p, 0.1),

    bg,
    surface,
    cream,
    sectionAlt,
    elevated,
    card,
    cardHover: mixHex(card, "#ffffff", 0.06),
    border,
    borderStrong,
    text,
    muted,
    ring: alphaHex(p, 0.35),

    navBg: bg,
    navText: text,
    navMuted: muted,
    footerBg,
    footerText,
    footerBorder,
    footerMuted,
    footerSubtle,

    sidebarBg: card,
    sidebarBorder: border,
    sidebarActive: alphaHex(p, 0.14),
    sidebarActiveText: lighten(p, 0.06),

    btnPrimaryBg: p,
    btnPrimaryFg: contrastText(p),
    btnSecondaryBg: card,
    btnSecondaryFg: lighten(p, 0.04),
    btnSecondaryBorder: border,

    mode,
  };
}
