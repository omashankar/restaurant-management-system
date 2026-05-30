"use client";

import { restaurantAdminThemeStyle } from "@/lib/restaurantAdminThemeRuntime";
import {
  applyRestaurantDocumentTheme,
  clearRestaurantDocumentTheme,
} from "@/lib/restaurantThemeStorage";
import { useRestaurantTheme } from "@/hooks/useRestaurantTheme";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

let documentThemeSyncCount = 0;

const RESTAURANT_ADMIN_PREFIXES = [
  "/dashboard",
  "/admin",
  "/manager",
  "/waiter",
  "/chef",
  "/orders",
  "/menu",
  "/tables",
  "/pos",
  "/kitchen",
  "/inventory",
  "/settings",
  "/profile",
  "/analytics",
  "/billing",
  "/customers",
  "/staff",
  "/reservations",
  "/qr-menu",
  "/whatsapp",
  "/customer-site",
  "/printer-settings",
  "/support-tickets",
  "/onboarding",
];

export function isRestaurantAdminRoute(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/super-admin")) return false;
  return RESTAURANT_ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

function applyDocumentTheme(theme) {
  const style = restaurantAdminThemeStyle(theme);
  document.documentElement.dataset.restaurantAdminTheme = "true";
  for (const [key, value] of Object.entries(style)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function clearDocumentTheme() {
  delete document.documentElement.dataset.restaurantAdminTheme;
  for (const key of ["--ra-primary", "--ra-accent"]) {
    document.documentElement.style.removeProperty(key);
  }
}

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
