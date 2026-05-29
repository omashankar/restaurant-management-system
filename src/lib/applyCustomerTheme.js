/**
 * @deprecated Use @/theme/tokens and @/context/CustomerThemeContext
 */
import { DEFAULT_CUSTOMER_THEME } from "@/lib/customerThemeDefaults";
import { mergeCmsSection } from "@/lib/customerCmsMerge";
import { buildThemeCssVars, resolveThemeInput, themeRootClassName } from "@/theme/tokens";

export function resolveCustomerTheme(stored) {
  return resolveThemeInput(stored);
}

export function customerThemeCssVars(theme, modeOverride = null) {
  return buildThemeCssVars(theme, modeOverride);
}

export function customerThemeClassName(theme) {
  const t = resolveThemeInput(theme);
  return themeRootClassName(t.colorMode === "dark" ? "dark" : "light");
}
