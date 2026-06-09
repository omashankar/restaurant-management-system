/**
 * Normalize customer storefront paths.
 * `/r/pizza-palace/order/menu` → `/order/menu`
 */

export function normalizeCustomerStorefrontPath(pathname = "") {
  const path = String(pathname ?? "").split("?")[0];
  const slugMatch = path.match(/^\/r\/[^/]+(\/.*)?$/);
  if (slugMatch) return slugMatch[1] || "/home";
  return path || "/";
}

export function isCustomerStorefrontPath(pathname = "") {
  const normalized = normalizeCustomerStorefrontPath(pathname);
  return /^(\/home|\/order|\/account)(\/|$)/.test(normalized);
}
