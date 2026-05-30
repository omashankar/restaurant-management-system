import { resolveSuperAdminTheme } from "@/lib/superAdminThemeRuntime";

export const SUPER_ADMIN_THEME_STORAGE_KEY = "rms-super-admin-theme";

/** @returns {{ primaryColor: string, accentColor: string, darkMode: boolean } | null} */
export function readStoredSuperAdminTheme() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SUPER_ADMIN_THEME_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return resolveSuperAdminTheme(parsed);
  } catch {
    return null;
  }
}

export function writeStoredSuperAdminTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    const resolved = resolveSuperAdminTheme(theme);
    localStorage.setItem(
      SUPER_ADMIN_THEME_STORAGE_KEY,
      JSON.stringify({
        primaryColor: resolved.primaryColor,
        accentColor: resolved.accentColor,
        darkMode: resolved.darkMode,
        updatedAt: Date.now(),
      })
    );
  } catch {
    /* quota / private mode */
  }
}

/** Apply CSS variables on <html> before React paints. */
export function applySuperAdminDocumentTheme(theme) {
  if (typeof document === "undefined") return resolveSuperAdminTheme(theme);
  const resolved = resolveSuperAdminTheme(theme);
  document.documentElement.dataset.superAdminTheme = "true";
  document.documentElement.style.setProperty("--sa-primary", resolved.primaryColor);
  document.documentElement.style.setProperty("--sa-accent", resolved.accentColor);
  document.documentElement.style.setProperty("--platform-primary", resolved.primaryColor);
  document.documentElement.style.setProperty("--platform-accent", resolved.accentColor);
  return resolved;
}

export function clearSuperAdminDocumentTheme() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.superAdminTheme;
  for (const key of ["--sa-primary", "--sa-accent", "--platform-primary", "--platform-accent"]) {
    document.documentElement.style.removeProperty(key);
  }
}

/** Inline script — runs synchronously in layout before React hydration. */
export function superAdminThemeBootstrapScript() {
  const key = SUPER_ADMIN_THEME_STORAGE_KEY;
  return `(function(){try{var r=localStorage.getItem(${JSON.stringify(key)});if(!r)return;var t=JSON.parse(r);var d=document.documentElement;if(t.primaryColor){d.style.setProperty("--sa-primary",t.primaryColor);d.style.setProperty("--platform-primary",t.primaryColor);}if(t.accentColor){d.style.setProperty("--sa-accent",t.accentColor);d.style.setProperty("--platform-accent",t.accentColor);}d.dataset.superAdminTheme="true";}catch(e){}})();`;
}
