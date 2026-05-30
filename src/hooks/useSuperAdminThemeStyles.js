"use client";

import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import {
  resolveSuperAdminTheme,
  superAdminThemeStyle,
} from "@/lib/superAdminThemeRuntime";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

let documentThemeSyncCount = 0;

function applyDocumentTheme(theme) {
  const style = superAdminThemeStyle(theme);
  document.documentElement.dataset.superAdminTheme = "true";
  for (const [key, value] of Object.entries(style)) {
    document.documentElement.style.setProperty(key, value);
  }
}

function clearDocumentTheme() {
  delete document.documentElement.dataset.superAdminTheme;
  for (const key of ["--sa-primary", "--sa-accent", "--platform-primary", "--platform-accent"]) {
    document.documentElement.style.removeProperty(key);
  }
}

export function useSuperAdminThemeStyles() {
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const { config } = usePlatformConfig();
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const onPreview = (event) => setPreview(event.detail ?? null);
    const onClear = () => setPreview(null);
    window.addEventListener("super-admin-theme-preview", onPreview);
    window.addEventListener("super-admin-theme-preview-clear", onClear);
    window.addEventListener("platform-config-updated", onClear);
    return () => {
      window.removeEventListener("super-admin-theme-preview", onPreview);
      window.removeEventListener("super-admin-theme-preview-clear", onClear);
      window.removeEventListener("platform-config-updated", onClear);
    };
  }, []);

  const theme = useMemo(() => {
    if (preview) return preview;
    return resolveSuperAdminTheme(config.theme);
  }, [preview, config.theme]);

  const themeStyle = useMemo(() => superAdminThemeStyle(theme), [theme]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    documentThemeSyncCount += 1;
    applyDocumentTheme(theme);
    return () => {
      documentThemeSyncCount -= 1;
      if (documentThemeSyncCount <= 0) {
        documentThemeSyncCount = 0;
        clearDocumentTheme();
      }
    };
  }, [isSuperAdmin, theme]);

  return isSuperAdmin ? themeStyle : {};
}
