import { SUPER_ADMIN_ACCENT, SUPER_ADMIN_PRIMARY } from "@/config/superAdminTheme";

const HEX6 = /^#([0-9a-fA-F]{6})$/;
const HEX3 = /^#([0-9a-fA-F]{3})$/;

export function normalizeHexColor(value) {
  const v = String(value ?? "").trim();
  if (HEX6.test(v)) return v.toLowerCase();
  const m3 = HEX3.exec(v);
  if (m3) {
    const [a, b, c] = m3[1];
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return null;
}

export function clampHexColor(value, fallback) {
  return normalizeHexColor(value) ?? fallback;
}

export function resolveSuperAdminTheme(theme) {
  return {
    primaryColor: clampHexColor(theme?.primaryColor, SUPER_ADMIN_PRIMARY),
    accentColor: clampHexColor(theme?.accentColor, SUPER_ADMIN_ACCENT),
    darkMode: theme?.darkMode !== false,
  };
}

export function superAdminThemeStyle(theme) {
  const { primaryColor, accentColor } = resolveSuperAdminTheme(theme);
  return {
    "--sa-primary": primaryColor,
    "--sa-accent": accentColor,
    "--platform-primary": primaryColor,
    "--platform-accent": accentColor,
  };
}

export function dispatchSuperAdminThemePreview(theme) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("super-admin-theme-preview", { detail: resolveSuperAdminTheme(theme) })
  );
}

export function clearSuperAdminThemePreview() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("super-admin-theme-preview-clear"));
}
