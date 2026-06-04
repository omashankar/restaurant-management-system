import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { applyAdminColorMode, clearAdminColorMode } from "@/lib/adminColorMode";
import { resolveRestaurantAdminTheme } from "@/lib/restaurantAdminThemeRuntime";

export const RESTAURANT_ADMIN_THEME_STORAGE_KEY = "rms-restaurant-admin-theme";

/** @returns {{ primaryColor: string, accentColor: string, darkMode: boolean } | null} */
export function readStoredRestaurantTheme() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RESTAURANT_ADMIN_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return resolveRestaurantAdminTheme({
      ...EMPTY_SETTINGS.theme,
      ...parsed,
    });
  } catch {
    return null;
  }
}

export function writeStoredRestaurantTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    const resolved = resolveRestaurantAdminTheme(theme);
    localStorage.setItem(
      RESTAURANT_ADMIN_THEME_STORAGE_KEY,
      JSON.stringify({
        primaryColor: resolved.primaryColor,
        accentColor: resolved.accentColor,
        darkMode: resolved.darkMode,
        updatedAt: Date.now(),
      })
    );
  } catch {
    /* quota / private mode */
  }
}

/** Apply CSS variables on <html> so theme is correct before React paints. */
export function applyRestaurantDocumentTheme(theme) {
  if (typeof document === "undefined") return resolveRestaurantAdminTheme(theme);
  const resolved = resolveRestaurantAdminTheme(theme);
  document.documentElement.dataset.restaurantAdminTheme = "true";
  document.documentElement.style.setProperty("--ra-primary", resolved.primaryColor);
  document.documentElement.style.setProperty("--ra-accent", resolved.accentColor);
  applyAdminColorMode(resolved);
  return resolved;
}

export function clearRestaurantDocumentTheme() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.restaurantAdminTheme;
  for (const key of ["--ra-primary", "--ra-accent"]) {
    document.documentElement.style.removeProperty(key);
  }
  clearAdminColorMode();
}

/** Inline script — runs synchronously in layout before React hydration. */
export function restaurantThemeBootstrapScript() {
  const key = RESTAURANT_ADMIN_THEME_STORAGE_KEY;
  return `(function(){try{var p=location.pathname||"";if(p.indexOf("/super-admin")===0)return;var r=localStorage.getItem(${JSON.stringify(key)});if(!r)return;var t=JSON.parse(r);var d=document.documentElement;if(t.primaryColor)d.style.setProperty("--ra-primary",t.primaryColor);if(t.accentColor)d.style.setProperty("--ra-accent",t.accentColor);d.dataset.restaurantAdminTheme="true";}catch(e){}})();`;
}
