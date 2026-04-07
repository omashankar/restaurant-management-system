/**
 * All permissions in the system.
 * Add new ones here — nowhere else.
 *
 * @typedef {typeof ALL_PERMISSIONS[number]} Permission
 */
export const ALL_PERMISSIONS = /** @type {const} */ ([
  // Financial visibility
  "view_sales",
  "view_analytics",
  "view_reports",
  "export_reports",

  // Orders
  "manage_orders",
  "view_orders",
  "update_order_status",

  // Menu
  "manage_menu",
  "view_menu",

  // Tables
  "manage_tables",
  "view_tables",

  // Inventory
  "manage_inventory",
  "view_inventory",

  // Reservations
  "manage_reservations",
  "view_reservations",

  // Customers
  "manage_customers",
  "view_customers",

  // Staff
  "manage_staff",
  "view_staff",

  // Settings
  "manage_settings",
]);

/** @typedef {'admin'|'manager'|'waiter'|'chef'} Role */

/** @type {Record<Role, Permission[]>} */
export const ROLE_PERMISSIONS = {
  admin: [
    // Admin has everything
    ...ALL_PERMISSIONS,
  ],

  manager: [
    "view_sales",
    "view_analytics",
    "view_reports",
    // managers cannot export_reports or manage_settings or manage_staff
    "manage_orders",
    "view_orders",
    "update_order_status",
    "manage_menu",
    "view_menu",
    "manage_tables",
    "view_tables",
    "manage_inventory",
    "view_inventory",
    "manage_reservations",
    "view_reservations",
    "manage_customers",
    "view_customers",
    "view_staff", // can view but not manage
  ],

  waiter: [
    "manage_orders",
    "view_orders",
    "update_order_status",
    "view_menu",
    "view_tables",
    "view_reservations",
    "view_customers",
  ],

  chef: [
    "view_orders",
    "update_order_status",
    "view_menu",
    "view_inventory",
  ],
};
