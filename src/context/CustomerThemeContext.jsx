"use client";

import { useRestaurantCms } from "@/hooks/useRestaurantCms";
import { useRestaurantInfo } from "@/hooks/useRestaurantInfo";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import {
  buildThemeCssVars,
  resolveThemeInput,
  themeRootClassName,
  themeSnapshot,
} from "@/theme/tokens";
import {
  loadModePreference,
  loadThemeCache,
  saveModePreference,
  saveThemeCache,
} from "@/theme/storage";
import { generatePalette } from "@/theme/palette";
import { clampHex } from "@/theme/palette";
import { DEFAULT_PRIMARY } from "@/theme/constants";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CustomerThemeContext = createContext(null);

export function CustomerThemeProvider({ children }) {
  const { content, loading: cmsLoading } = useRestaurantCms();
  const { info } = useRestaurantInfo();
  const { slug } = useRestaurantSlug();
  const cmsTheme = content?.theme;

  const [bootCache, setBootCache] = useState(null);
  const [mode, setModeState] = useState("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const cached = loadThemeCache(slug);
    setBootCache(cached);
    const preferred = loadModePreference(slug);
    const cmsMode = cmsTheme?.colorMode === "dark" ? "dark" : "light";
    setModeState(preferred ?? cmsMode);
    setHydrated(true);
  }, [slug, cmsTheme?.colorMode]);

  const effectiveTheme = useMemo(() => {
    if (cmsTheme?.primaryColor) return cmsTheme;
    if (!bootCache) return cmsTheme;
    return {
      ...cmsTheme,
      primaryColor: bootCache.primaryColor,
      fontFamily: bootCache.fontFamily ?? cmsTheme?.fontFamily,
    };
  }, [cmsTheme, bootCache]);

  useEffect(() => {
    if (!hydrated || cmsLoading) return;
    const snapshot = themeSnapshot(effectiveTheme);
    const prev = loadThemeCache(slug) ?? {};
    saveThemeCache(slug, {
      ...snapshot,
      userColorMode: prev.userColorMode,
      hasUserColorModeChoice: prev.hasUserColorModeChoice,
    });
  }, [hydrated, cmsLoading, effectiveTheme, mode, slug]);

  const setMode = useCallback(
    (next) => {
      const m = next === "dark" ? "dark" : "light";
      setModeState(m);
      saveModePreference(slug, m);
    },
    [slug]
  );

  const toggleMode = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const resolved = useMemo(() => resolveThemeInput(effectiveTheme), [effectiveTheme]);

  const primary = clampHex(resolved.primaryColor, DEFAULT_PRIMARY);

  const palette = useMemo(
    () => generatePalette(primary, mode),
    [primary, mode]
  );

  const cssVars = useMemo(
    () => buildThemeCssVars(effectiveTheme, mode),
    [effectiveTheme, mode]
  );

  const className = themeRootClassName(mode);

  useEffect(() => {
    const name = info?.name?.trim() || "Restaurant";
    const description =
      content?.about?.description?.trim()?.slice(0, 160)
      || content?.hero?.subheadline?.trim()?.slice(0, 160)
      || `Order online, book a table, and explore the menu at ${name}.`;
    document.title = `${name} · Order Online`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [info?.name, content?.about?.description, content?.hero?.subheadline]);

  useEffect(() => {
    const url = cmsTheme?.faviconUrl?.trim();
    if (!url) return;
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = url;
  }, [cmsTheme?.faviconUrl]);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    if (mode === "dark") {
      document.documentElement.dataset.customerDark = "true";
    } else {
      delete document.documentElement.dataset.customerDark;
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
      primary,
      palette,
      cssVars,
      className,
      resolved,
      hydrated,
      isDark: mode === "dark",
    }),
    [mode, setMode, toggleMode, primary, palette, cssVars, className, resolved, hydrated]
  );

  return (
    <CustomerThemeContext.Provider value={value}>
      <div
        className={`${className} customer-theme-root min-h-screen min-h-[100dvh]`}
        style={cssVars}
        data-theme={mode}
        suppressHydrationWarning
      >
        {children}
      </div>
    </CustomerThemeContext.Provider>
  );
}

export function useCustomerTheme() {
  const ctx = useContext(CustomerThemeContext);
  if (!ctx) {
    throw new Error("useCustomerTheme must be used within CustomerThemeProvider");
  }
  return ctx;
}
