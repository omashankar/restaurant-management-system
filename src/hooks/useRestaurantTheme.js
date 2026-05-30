"use client";

import { EMPTY_SETTINGS } from "@/config/settingsConfig";
import { resolveRestaurantAdminTheme } from "@/lib/restaurantAdminThemeRuntime";
import {
  applyRestaurantDocumentTheme,
  readStoredRestaurantTheme,
  writeStoredRestaurantTheme,
} from "@/lib/restaurantThemeStorage";
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
  const [theme, setTheme] = useState(
    () => _cache ?? readStoredRestaurantTheme() ?? getDefaultTheme()
  );
  const [loading, setLoading] = useState(!_cache);

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
          const fallback = _cache ?? getDefaultTheme();
          setTheme(fallback);
          return;
        }
        const next = resolveRestaurantAdminTheme({
          ...EMPTY_SETTINGS.theme,
          ...(data.settings?.theme ?? {}),
        });
        _cache = next;
        _cacheTime = Date.now();
        writeStoredRestaurantTheme(next);
        applyRestaurantDocumentTheme(next);
        setTheme(next);
      } catch {
        if (mounted) setTheme(_cache ?? getDefaultTheme());
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const onUpdate = (event) => {
      if (event?.detail?.primaryColor) {
        setTheme(event.detail);
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
  }, []);

  return { theme, loading };
}
