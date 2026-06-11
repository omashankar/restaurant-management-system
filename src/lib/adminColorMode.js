/** Shared dark/light surface mode for Restaurant Admin + Super Admin shells. */

export const ADMIN_COLOR_MODE_STORAGE_KEY = "rms-admin-color-mode";

export function resolveAdminColorMode(theme) {
  return theme?.darkMode !== false ? "dark" : "light";
}

export function readStoredAdminColorMode() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_COLOR_MODE_STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredAdminColorMode(mode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_COLOR_MODE_STORAGE_KEY, mode);
  } catch {
    /* quota / private mode */
  }
}

let modeSwitchGuardTimer = null;

function endAdminModeSwitchGuard() {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const clear = () => {
    delete root.dataset.adminModeSwitching;
    modeSwitchGuardTimer = null;
  };
  if (modeSwitchGuardTimer) {
    window.clearTimeout(modeSwitchGuardTimer);
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      modeSwitchGuardTimer = window.setTimeout(clear, 400);
    });
  });
}

/** Suppress border/background transitions while CSS variables flip (avoids white border flash). */
function beginAdminModeSwitchGuard(previousMode, nextMode) {
  if (typeof document === "undefined") return;
  if (!previousMode || previousMode === nextMode) return;
  document.documentElement.dataset.adminModeSwitching = "";
}

export function applyAdminColorMode(theme) {
  if (typeof document === "undefined") return resolveAdminColorMode(theme);
  const mode = resolveAdminColorMode(theme);
  setDocumentAdminMode(mode);
  writeStoredAdminColorMode(mode);
  return mode;
}

export function clearAdminColorMode() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.adminMode;
  try {
    localStorage.removeItem(ADMIN_COLOR_MODE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function setDocumentAdminMode(mode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const previousMode = root.dataset.adminMode;
  const isModeChange = Boolean(previousMode && previousMode !== mode);
  beginAdminModeSwitchGuard(previousMode, mode);
  root.dataset.adminMode = mode;
  if (isModeChange) {
    endAdminModeSwitchGuard();
  }
}

/** Re-apply light/dark for the active portal after clearing portal-specific branding. */
export function reapplyPortalAdminColorMode() {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const sa = window.location.pathname.startsWith("/super-admin");
  const themeKey = sa ? "rms-super-admin-theme" : "rms-restaurant-admin-theme";
  try {
    const raw = localStorage.getItem(themeKey);
    if (raw) {
      const t = JSON.parse(raw);
      const mode = t?.darkMode === false ? "light" : "dark";
      setDocumentAdminMode(mode);
      writeStoredAdminColorMode(mode);
      return mode;
    }
  } catch {
    /* ignore */
  }
  const fallback = readStoredAdminColorMode() ?? "dark";
  setDocumentAdminMode(fallback);
  return fallback;
}
