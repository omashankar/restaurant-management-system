"use client";

import { isRestaurantAdminRoute } from "@/lib/restaurantAdminRoutes";
import { restaurantAdminThemeStyle } from "@/lib/restaurantAdminThemeRuntime";
import {
  applyRestaurantDocumentTheme,
  clearRestaurantDocumentTheme,
} from "@/lib/restaurantThemeStorage";
import { useRestaurantTheme } from "@/hooks/useRestaurantTheme";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

let documentThemeSyncCount = 0;

export { isRestaurantAdminRoute } from "@/lib/restaurantAdminRoutes";

export function useRestaurantAdminThemeStyles() {
  const pathname = usePathname();
  const isRestaurantAdmin = isRestaurantAdminRoute(pathname);
  const { theme: savedTheme } = useRestaurantTheme();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const onPreview = (event) => setPreview(event.detail ?? null);
    const onClear = () => setPreview(null);
    window.addEventListener("restaurant-theme-preview", onPreview);
    window.addEventListener("restaurant-theme-preview-clear", onClear);
    return () => {
      window.removeEventListener("restaurant-theme-preview", onPreview);
      window.removeEventListener("restaurant-theme-preview-clear", onClear);
    };
  }, []);

  const theme = preview ?? savedTheme;
  const themeStyle = useMemo(() => restaurantAdminThemeStyle(theme), [theme]);

  useEffect(() => {
    if (!isRestaurantAdmin) return;
    documentThemeSyncCount += 1;
    applyRestaurantDocumentTheme(theme);
    return () => {
      documentThemeSyncCount -= 1;
      if (documentThemeSyncCount <= 0) {
        documentThemeSyncCount = 0;
        clearRestaurantDocumentTheme();
      }
    };
  }, [isRestaurantAdmin, theme]);

  return isRestaurantAdmin ? themeStyle : {};
}
