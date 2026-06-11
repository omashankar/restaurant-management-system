"use client";

import { usePlatformConfig } from "@/hooks/usePlatformConfig";
import {
  applySuperAdminDocumentTheme,
  clearSuperAdminDocumentTheme,
} from "@/lib/superAdminThemeStorage";
import {
  resolveSuperAdminTheme,
  superAdminThemeStyle,
} from "@/lib/superAdminThemeRuntime";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

let documentThemeSyncCount = 0;

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

  /* Apply theme on change — no cleanup (avoids flash when toggling light/dark). */
  useEffect(() => {
    if (!isSuperAdmin) return;
    applySuperAdminDocumentTheme(theme);
  }, [isSuperAdmin, theme]);

  /* Clear branding only when leaving Super Admin (not on every theme object change). */
  useEffect(() => {
    if (!isSuperAdmin) return;
    documentThemeSyncCount += 1;
    return () => {
      documentThemeSyncCount -= 1;
      if (documentThemeSyncCount <= 0) {
        documentThemeSyncCount = 0;
        if (
          typeof window !== "undefined" &&
          !window.location.pathname.startsWith("/super-admin")
        ) {
          clearSuperAdminDocumentTheme();
        }
      }
    };
  }, [isSuperAdmin]);

  return isSuperAdmin ? superAdminThemeStyle(theme) : {};
}
