/**
 * Prefer live browser-stored admin theme (header toggle) over API values
 * so light/dark and brand colors are not reset on settings fetch.
 */
export function mergeLiveAdminTheme(apiTheme, storedTheme) {
  const api = apiTheme && typeof apiTheme === "object" ? apiTheme : {};
  if (!storedTheme || typeof storedTheme !== "object") return { ...api };
  return {
    ...api,
    primaryColor: storedTheme.primaryColor ?? api.primaryColor,
    accentColor: storedTheme.accentColor ?? api.accentColor,
    darkMode:
      storedTheme.darkMode !== undefined ? storedTheme.darkMode : api.darkMode,
  };
}
