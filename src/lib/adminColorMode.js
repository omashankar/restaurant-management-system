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

export function applyAdminColorMode(theme) {
  if (typeof document === "undefined") return resolveAdminColorMode(theme);
  const mode = resolveAdminColorMode(theme);
  document.documentElement.dataset.adminMode = mode;
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

/** Runs before React — restores light/dark from unified key or portal theme storage. */
export function adminColorModeBootstrapScript() {
  const modeKey = ADMIN_COLOR_MODE_STORAGE_KEY;
  const saKey = "rms-super-admin-theme";
  const raKey = "rms-restaurant-admin-theme";
  return `(function(){try{var d=document.documentElement;var p=location.pathname||"";var sa=p.indexOf("/super-admin")===0;var mode=localStorage.getItem(${JSON.stringify(modeKey)});if(mode!=="light"&&mode!=="dark"){var key=sa?${JSON.stringify(saKey)}:${JSON.stringify(raKey)};var r=localStorage.getItem(key);if(r){var t=JSON.parse(r);mode=t.darkMode===false?"light":"dark";}else{mode="dark";}}d.dataset.adminMode=mode;}catch(e){}})();`;
}
