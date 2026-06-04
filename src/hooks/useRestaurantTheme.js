"use client";

import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { useUser } from "@/context/AuthContext";
import {
  isRestaurantAdminRoute,
  RESTAURANT_THEME_ROLES,
} from "@/lib/restaurantAdminRoutes";
import { resolveRestaurantAdminTheme } from "@/lib/restaurantAdminThemeRuntime";
import { mergeLiveAdminTheme } from "@/lib/mergeLiveAdminTheme";
import {
  applyRestaurantDocumentTheme,
  readStoredRestaurantTheme,
  writeStoredRestaurantTheme,
} from "@/lib/restaurantThemeStorage";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

let _cache = null;
let _cacheTime = 0;
const TTL = 60_000;

function getDefaultTheme() {
  return resolveRestaurantAdminTheme(EMPTY_SETTINGS.theme);
}

function warmCacheFromStorage() {
  if (_cache) return _cache;
  const stored = readStoredRestaurantTheme();
  if (stored) {
    _cache = stored;
    _cacheTime = Date.now();
    applyRestaurantDocumentTheme(stored);
  }
  return _cache;
}

if (typeof window !== "undefined") {
  warmCacheFromStorage();
}

/** Push saved theme into cache immediately (after save / load). */
export function updateRestaurantThemeCache(theme) {
  const next = resolveRestaurantAdminTheme(theme ?? EMPTY_SETTINGS.theme);
  _cache = next;
  _cacheTime = Date.now();
  writeStoredRestaurantTheme(next);
  applyRestaurantDocumentTheme(next);
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("restaurant-theme-updated", { detail: next })
    );
  }
  return next;
}

export function invalidateRestaurantThemeCache() {
  _cache = null;
  _cacheTime = 0;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("restaurant-theme-updated"));
  }
}

export function useRestaurantTheme() {
  const pathname = usePathname();
  const { user, hydrated: authHydrated } = useUser();
  const [theme, setTheme] = useState(
    () => _cache ?? readStoredRestaurantTheme() ?? getDefaultTheme()
  );
  const [loading, setLoading] = useState(!_cache);

  const canFetchSettings =
    authHydrated &&
    Boolean(user) &&
    RESTAURANT_THEME_ROLES.has(user.role) &&
    isRestaurantAdminRoute(pathname);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const stored = readStoredRestaurantTheme();
      if (stored && !_cache) {
        _cache = stored;
        _cacheTime = Date.now();
        applyRestaurantDocumentTheme(stored);
        if (mounted) {
          setTheme(stored);
          setLoading(false);
        }
      }

      const localTheme = _cache ?? stored ?? getDefaultTheme();
      if (!canFetchSettings) {
        if (mounted) {
          setTheme(localTheme);
          setLoading(false);
        }
        return;
      }

      if (_cache && Date.now() - _cacheTime < TTL) {
        if (mounted) {
          setTheme(_cache);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok || !data.success) {
          setTheme(localTheme);
          return;
        }
        const apiNext = resolveRestaurantAdminTheme({
          ...EMPTY_SETTINGS.theme,
          ...(data.settings?.theme ?? {}),
        });
        const stored = readStoredRestaurantTheme();
        const next = stored
          ? resolveRestaurantAdminTheme(mergeLiveAdminTheme(apiNext, stored))
          : apiNext;
        _cache = next;
        _cacheTime = Date.now();
        writeStoredRestaurantTheme(next);
        applyRestaurantDocumentTheme(next);
        setTheme(next);
      } catch {
        if (mounted) setTheme(localTheme);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const onUpdate = (event) => {
      if (event?.detail && typeof event.detail === "object") {
        setTheme(resolveRestaurantAdminTheme(event.detail));
        return;
      }
      load();
    };

    load();
    window.addEventListener("restaurant-theme-updated", onUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("restaurant-theme-updated", onUpdate);
    };
  }, [canFetchSettings]);

  return { theme, loading };
}
