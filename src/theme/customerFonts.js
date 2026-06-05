import { CUSTOMER_FONT_OPTIONS, DEFAULT_CUSTOMER_THEME } from "@/lib/customerThemeDefaults";

/** Maps CMS fontFamily values to next/font CSS variables (loaded in root layout). */
export const CUSTOMER_FONT_CSS_VARS = {
  "Inter, system-ui, sans-serif": "var(--font-inter), system-ui, sans-serif",
  "Poppins, system-ui, sans-serif": "var(--font-poppins), system-ui, sans-serif",
  "DM Sans, system-ui, sans-serif": "var(--font-dm-sans), system-ui, sans-serif",
  "Nunito, system-ui, sans-serif": "var(--font-nunito), system-ui, sans-serif",
  "Roboto, system-ui, sans-serif": "var(--font-roboto), system-ui, sans-serif",
  "Open Sans, system-ui, sans-serif": "var(--font-open-sans), system-ui, sans-serif",
};

export function resolveCustomerFontStack(fontFamily) {
  const key = String(fontFamily ?? "").trim();
  return (
    CUSTOMER_FONT_CSS_VARS[key] ??
    CUSTOMER_FONT_CSS_VARS[DEFAULT_CUSTOMER_THEME.fontFamily] ??
    CUSTOMER_FONT_CSS_VARS[CUSTOMER_FONT_OPTIONS[0].value]
  );
}
