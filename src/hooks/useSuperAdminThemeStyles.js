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

  useEffect(() => {
    if (!isSuperAdmin) return;
    documentThemeSyncCount += 1;
    applySuperAdminDocumentTheme(theme);
    return () => {
      documentThemeSyncCount -= 1;
      if (documentThemeSyncCount <= 0) {
        documentThemeSyncCount = 0;
        clearSuperAdminDocumentTheme();
      }
    };
  }, [isSuperAdmin, theme]);

  return isSuperAdmin ? superAdminThemeStyle(theme) : {};
}
