import { CUSTOMER_THEME_STORAGE_KEY } from "@/theme/constants";

function readAll() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOMER_THEME_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(data) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOMER_THEME_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

/** @returns {{ primaryColor?, secondaryColor?, colorMode?, fontFamily?, updatedAt? } | null} */
export function loadThemeCache(slug) {
  if (!slug) return null;
  const entry = readAll()[slug];
  return entry && typeof entry === "object" ? entry : null;
}

export function saveThemeCache(slug, snapshot) {
  if (!slug || !snapshot) return;
  const all = readAll();
  all[slug] = { ...snapshot, updatedAt: Date.now() };
  writeAll(all);
}

/** User's light/dark preference override per restaurant */
export function loadModePreference(slug) {
  const c = loadThemeCache(slug);
  if (c?.colorMode === "dark" || c?.colorMode === "light") return c.colorMode;
  return null;
}

export function saveModePreference(slug, mode) {
  const prev = loadThemeCache(slug) ?? {};
  saveThemeCache(slug, { ...prev, colorMode: mode });
}
