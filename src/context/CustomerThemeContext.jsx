"use client";

import { useRestaurantCms } from "@/hooks/useRestaurantCms";
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
import { DEFAULT_PRIMARY, DEFAULT_SECONDARY } from "@/theme/constants";
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
    setModeState(preferred ?? cached?.colorMode ?? cmsMode);
    setHydrated(true);
  }, [slug, cmsTheme?.colorMode]);

  const effectiveTheme = useMemo(() => {
    if (cmsTheme?.primaryColor || cmsTheme?.secondaryColor) return cmsTheme;
    if (!bootCache) return cmsTheme;
    return {
      ...cmsTheme,
      primaryColor: bootCache.primaryColor,
      secondaryColor: bootCache.secondaryColor,
      fontFamily: bootCache.fontFamily ?? cmsTheme?.fontFamily,
    };
  }, [cmsTheme, bootCache]);

  useEffect(() => {
    if (!hydrated || cmsLoading) return;
    const snapshot = themeSnapshot(effectiveTheme, mode);
    saveThemeCache(slug, snapshot);
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
  const secondary = clampHex(resolved.secondaryColor, DEFAULT_SECONDARY);

  const palette = useMemo(
    () => generatePalette(primary, secondary, mode),
    [primary, secondary, mode]
  );

  const cssVars = useMemo(
    () => buildThemeCssVars(effectiveTheme, mode),
    [effectiveTheme, mode]
  );

  const className = themeRootClassName(mode);

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
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
      primary,
      secondary,
      palette,
      cssVars,
      className,
      resolved,
      hydrated,
      isDark: mode === "dark",
    }),
    [mode, setMode, toggleMode, primary, secondary, palette, cssVars, className, resolved, hydrated]
  );

  return (
    <CustomerThemeContext.Provider value={value}>
      <div
        className={`${className} customer-theme-root`}
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
