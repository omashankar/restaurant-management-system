import {
  RESTAURANT_ADMIN_ACCENT,
  RESTAURANT_ADMIN_PRIMARY,
} from "@/config/restaurantAdminTheme";
import { clampHexColor } from "@/lib/superAdminThemeRuntime";

export function resolveRestaurantAdminTheme(theme) {
  return {
    primaryColor: clampHexColor(theme?.primaryColor, RESTAURANT_ADMIN_PRIMARY),
    accentColor: clampHexColor(theme?.accentColor, RESTAURANT_ADMIN_ACCENT),
    darkMode: theme?.darkMode !== false,
  };
}

export function restaurantAdminThemeStyle(theme) {
  const { primaryColor, accentColor } = resolveRestaurantAdminTheme(theme);
  return {
    "--ra-primary": primaryColor,
    "--ra-accent": accentColor,
  };
}

export function dispatchRestaurantThemePreview(theme) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("restaurant-theme-preview", {
      detail: resolveRestaurantAdminTheme(theme),
    })
  );
}

export function clearRestaurantThemePreview() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("restaurant-theme-preview-clear"));
}
