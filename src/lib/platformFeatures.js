/** Platform-wide feature kill-switches (Super Admin → Advanced). */

import { normalizeCustomerStorefrontPath } from "@/lib/customerStorefrontPath";

const PATH_RULES = [
  { key: "featureMenuQR", paths: ["/qr-menu"] },
  {
    key: "featureOnlineOrder",
    paths: ["/order", "/customer-site", "/api/customer/orders"],
  },
  {
    key: "featureReservations",
    paths: [
      "/reservations",
      "/order/table-booking",
      "/api/reservations",
      "/api/customer/reservations",
    ],
  },
  { key: "featureInventory", paths: ["/inventory", "/api/inventory"] },
];

export function getPlatformFeatureForPath(pathname = "") {
  const path = normalizeCustomerStorefrontPath(String(pathname).split("?")[0]);
  for (const rule of PATH_RULES) {
    const matched = rule.paths.some(
      (p) => path === p || path.startsWith(`${p}/`),
    );
    if (matched) return rule.key;
  }
  return null;
}

export function isPlatformFeatureEnabled(features, featureKey) {
  if (!featureKey) return true;
  return features?.[featureKey] !== false;
}

export function isPathAllowedByPlatformFeatures(pathname, features) {
  const key = getPlatformFeatureForPath(pathname);
  return isPlatformFeatureEnabled(features, key);
}

/** Server-only guard lives in platformFeatureGuard.js */
export function platformFeatureDisabledResponse(featureKey) {
  const labels = {
    featureMenuQR: "QR Menu",
    featureOnlineOrder: "Online Ordering",
    featureReservations: "Reservations",
    featureInventory: "Inventory",
  };
  const label = labels[featureKey] ?? "This feature";
  return Response.json(
    {
      success: false,
      error: `${label} is disabled platform-wide by the administrator.`,
      code: "PLATFORM_FEATURE_DISABLED",
    },
    { status: 403 },
  );
}
