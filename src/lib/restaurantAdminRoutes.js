export const RESTAURANT_ADMIN_PREFIXES = [
  "/dashboard",
  "/admin",
  "/manager",
  "/waiter",
  "/chef",
  "/orders",
  "/menu",
  "/coupons",
  "/tables",
  "/pos",
  "/kitchen",
  "/inventory",
  "/settings",
  "/profile",
  "/analytics",
  "/billing",
  "/customers",
  "/staff",
  "/reservations",
  "/qr-menu",
  "/whatsapp",
  "/customer-site",
  "/printer-settings",
  "/support-tickets",
  "/onboarding",
];

export const RESTAURANT_THEME_ROLES = new Set(["admin", "manager", "waiter", "chef"]);

export function isRestaurantAdminRoute(pathname) {
  if (!pathname) return false;
  if (pathname.startsWith("/super-admin")) return false;
  return RESTAURANT_ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
