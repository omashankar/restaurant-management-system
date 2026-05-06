export const ACCESS_CONTROL_FEATURES = [
  { key: "posSystem", label: "POS System", routes: ["/pos"] },
  { key: "orders", label: "Orders", routes: ["/orders"] },
  { key: "menuManagement", label: "Menu Management", routes: ["/menu"] },
  { key: "inventory", label: "Inventory", routes: ["/inventory"] },
  { key: "reservations", label: "Reservations", routes: ["/reservations"] },
  { key: "customers", label: "Customers", routes: ["/customers"] },
  { key: "staffManagement", label: "Staff Management", routes: ["/staff"] },
  { key: "analytics", label: "Analytics", routes: ["/analytics"] },
  { key: "settings", label: "Settings", routes: ["/settings"] },
  { key: "kitchenDisplay", label: "Kitchen Display", routes: ["/kitchen"] },
];

export const ACCESS_ROLES = ["admin", "manager", "waiter", "chef"];

export const DEFAULT_ACCESS_CONTROL = {
  posSystem: { admin: true, manager: true, waiter: true, chef: false },
  orders: { admin: true, manager: true, waiter: true, chef: true },
  menuManagement: { admin: true, manager: true, waiter: false, chef: false },
  inventory: { admin: true, manager: true, waiter: false, chef: false },
  reservations: { admin: true, manager: true, waiter: true, chef: false },
  customers: { admin: true, manager: true, waiter: true, chef: false },
  staffManagement: { admin: true, manager: false, waiter: false, chef: false },
  analytics: { admin: true, manager: true, waiter: false, chef: false },
  settings: { admin: true, manager: false, waiter: false, chef: false },
  kitchenDisplay: { admin: true, manager: false, waiter: false, chef: true },
};

export function normalizeAccessControl(input) {
  const normalized = {};

  for (const feature of ACCESS_CONTROL_FEATURES) {
    const key = feature.key;
    const row = input?.[key] ?? {};
    normalized[key] = {};

    for (const role of ACCESS_ROLES) {
      const fallback = DEFAULT_ACCESS_CONTROL[key][role];
      normalized[key][role] = typeof row[role] === "boolean" ? row[role] : fallback;
    }
  }

  // Keep admin locked to true as an emergency fail-safe.
  for (const feature of ACCESS_CONTROL_FEATURES) {
    normalized[feature.key].admin = true;
  }

  return normalized;
}

export function getFeatureForPath(pathname = "") {
  for (const feature of ACCESS_CONTROL_FEATURES) {
    const matched = feature.routes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    if (matched) return feature.key;
  }
  return null;
}
