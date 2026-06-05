"use client";

import { mergeLiveAdminTheme } from "@/lib/mergeLiveAdminTheme";
import {
  applySuperAdminDocumentTheme,
  readStoredSuperAdminTheme,
  writeStoredSuperAdminTheme,
} from "@/lib/superAdminThemeStorage";
import { resolveSuperAdminTheme } from "@/lib/superAdminThemeRuntime";
import { useEffect, useState } from "react";

const DEFAULT_CONFIG = {
  maintenanceMode: false,
  appName: "RMS Platform",
  features: {
    featureMenuQR: true,
    featureOnlineOrder: true,
    featureReservations: true,
    featureInventory: true,
  },
  currency: "INR",
  language: "en",
  theme: { primaryColor: "#a3e635", accentColor: "#10b981", darkMode: true },
  integrations: { googleAnalyticsId: "", metaPixelId: "" },
};

let _cache = null;
let _cacheTime = 0;
const TTL = 60_000;

function mergeConfig(base) {
  return {
    ...DEFAULT_CONFIG,
    ...base,
    features: { ...DEFAULT_CONFIG.features, ...(base?.features ?? {}) },
    theme: { ...DEFAULT_CONFIG.theme, ...(base?.theme ?? {}) },
  };
}

function getInitialConfig() {
  if (_cache) return _cache;
  const storedTheme = readStoredSuperAdminTheme();
  if (storedTheme) {
    return mergeConfig({
      theme: {
        primaryColor: storedTheme.primaryColor,
        accentColor: storedTheme.accentColor,
        darkMode: storedTheme.darkMode,
      },
    });
  }
  return DEFAULT_CONFIG;
}

function warmThemeFromStorage() {
  const stored = readStoredSuperAdminTheme();
  if (stored) {
    applySuperAdminDocumentTheme(stored);
  }
}

if (typeof window !== "undefined" && window.location.pathname.startsWith("/super-admin")) {
  warmThemeFromStorage();
}

/** Push saved Super Admin theme into cache + localStorage immediately. */
export function updateSuperAdminThemeCache(theme) {
  const resolved = resolveSuperAdminTheme(theme);
  writeStoredSuperAdminTheme(resolved);
  if (
    typeof window === "undefined" ||
    window.location.pathname.startsWith("/super-admin")
  ) {
    applySuperAdminDocumentTheme(resolved);
  }
  _cache = mergeConfig({
    ...(_cache ?? {}),
    theme: {
      primaryColor: resolved.primaryColor,
      accentColor: resolved.accentColor,
      darkMode: resolved.darkMode,
    },
  });
  _cacheTime = Date.now();
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("super-admin-theme-updated", { detail: resolved })
    );
  }
  return resolved;
}

export function invalidatePlatformConfigCache() {
  _cache = null;
  _cacheTime = 0;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("platform-config-updated"));
  }
}

export function usePlatformConfig() {
  const [config, setConfig] = useState(getInitialConfig);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const isSuperAdminRoute =
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/super-admin");

      const stored = readStoredSuperAdminTheme();
      if (stored && !_cache) {
        const seeded = mergeConfig({
          theme: {
            primaryColor: stored.primaryColor,
            accentColor: stored.accentColor,
            darkMode: stored.darkMode,
          },
        });
        _cache = seeded;
        _cacheTime = Date.now();
        if (isSuperAdminRoute) applySuperAdminDocumentTheme(stored);
        if (mounted) {
          setConfig(seeded);
          setLoading(false);
        }
      }

      if (_cache && Date.now() - _cacheTime < TTL) {
        if (mounted) {
          setConfig(_cache);
          setLoading(false);
        }
        return;
      }

      try {
        const res = await fetch("/api/platform/config");
        const data = await res.json();
        if (!mounted) return;
        const next = mergeConfig(data);
        const stored = readStoredSuperAdminTheme();
        const mergedTheme = stored
          ? resolveSuperAdminTheme(mergeLiveAdminTheme(next.theme, stored))
          : resolveSuperAdminTheme(next.theme);
        const withLiveTheme = { ...next, theme: mergedTheme };
        _cache = withLiveTheme;
        _cacheTime = Date.now();
        writeStoredSuperAdminTheme(mergedTheme);
        if (isSuperAdminRoute) applySuperAdminDocumentTheme(mergedTheme);
        setConfig(withLiveTheme);
      } catch {
        if (mounted) setConfig(_cache ?? DEFAULT_CONFIG);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const onUpdate = () => load();
    const onThemeUpdate = (event) => {
      if (!event?.detail) return;
      if (!mounted) return;
      setConfig((prev) =>
        mergeConfig({
          ...prev,
          theme: {
            ...prev.theme,
            primaryColor: event.detail.primaryColor,
            accentColor: event.detail.accentColor,
            darkMode: event.detail.darkMode,
          },
        })
      );
    };

    load();
    window.addEventListener("platform-config-updated", onUpdate);
    window.addEventListener("super-admin-theme-updated", onThemeUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("platform-config-updated", onUpdate);
      window.removeEventListener("super-admin-theme-updated", onThemeUpdate);
    };
  }, []);

  return { config, loading, features: config.features ?? DEFAULT_CONFIG.features };
}
