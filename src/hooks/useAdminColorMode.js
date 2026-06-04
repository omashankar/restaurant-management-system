"use client";

import { updateSuperAdminThemeCache } from "@/hooks/usePlatformConfig";
import { updateRestaurantThemeCache } from "@/hooks/useRestaurantTheme";
import { resolveRestaurantAdminTheme } from "@/lib/restaurantAdminThemeRuntime";
import { readStoredRestaurantTheme } from "@/lib/restaurantThemeStorage";
import { resolveSuperAdminTheme } from "@/lib/superAdminThemeRuntime";
import { readStoredSuperAdminTheme } from "@/lib/superAdminThemeStorage";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function readModeFromDocument() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.adminMode === "light" ? "light" : "dark";
}

function resolvePortal(portal, pathname) {
  if (portal === "ra" || portal === "restaurant") return "restaurant";
  if (portal === "sa" || portal === "super-admin") return "super-admin";
  return pathname?.startsWith("/super-admin") ? "super-admin" : "restaurant";
}

/** Toggle dark/light for Restaurant Admin or Super Admin shell. */
export function useAdminColorMode(portal) {
  const pathname = usePathname();
  const scope = resolvePortal(portal, pathname);
  const [mode, setMode] = useState("dark");

  useEffect(() => {
    const sync = () => setMode(readModeFromDocument());
    sync();
    window.addEventListener("restaurant-theme-updated", sync);
    window.addEventListener("super-admin-theme-updated", sync);
    window.addEventListener("restaurant-theme-preview", sync);
    window.addEventListener("super-admin-theme-preview", sync);
    window.addEventListener("restaurant-theme-preview-clear", sync);
    window.addEventListener("super-admin-theme-preview-clear", sync);
    return () => {
      window.removeEventListener("restaurant-theme-updated", sync);
      window.removeEventListener("super-admin-theme-updated", sync);
      window.removeEventListener("restaurant-theme-preview", sync);
      window.removeEventListener("super-admin-theme-preview", sync);
      window.removeEventListener("restaurant-theme-preview-clear", sync);
      window.removeEventListener("super-admin-theme-preview-clear", sync);
    };
  }, []);

  const toggle = useCallback(() => {
    const nextDarkMode = mode === "light";
    if (scope === "super-admin") {
      const base = readStoredSuperAdminTheme() ?? resolveSuperAdminTheme({});
      updateSuperAdminThemeCache({ ...base, darkMode: nextDarkMode });
    } else {
      const base = readStoredRestaurantTheme() ?? resolveRestaurantAdminTheme({});
      updateRestaurantThemeCache({ ...base, darkMode: nextDarkMode });
    }
    setMode(nextDarkMode ? "dark" : "light");
  }, [mode, scope]);

  return {
    mode,
    isLight: mode === "light",
    isDark: mode !== "light",
    toggle,
    setLight: () => {
      if (mode === "light") return;
      if (scope === "super-admin") {
        const base = readStoredSuperAdminTheme() ?? resolveSuperAdminTheme({});
        updateSuperAdminThemeCache({ ...base, darkMode: false });
      } else {
        const base = readStoredRestaurantTheme() ?? resolveRestaurantAdminTheme({});
        updateRestaurantThemeCache({ ...base, darkMode: false });
      }
      setMode("light");
    },
    setDark: () => {
      if (mode === "dark") return;
      if (scope === "super-admin") {
        const base = readStoredSuperAdminTheme() ?? resolveSuperAdminTheme({});
        updateSuperAdminThemeCache({ ...base, darkMode: true });
      } else {
        const base = readStoredRestaurantTheme() ?? resolveRestaurantAdminTheme({});
        updateRestaurantThemeCache({ ...base, darkMode: true });
      }
      setMode("dark");
    },
  };
}
