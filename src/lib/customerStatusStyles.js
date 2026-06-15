/** Order status badge classes — theme-aware via globals.css */

export const ORDER_STATUS_BADGE = {
  new: "ct-status-badge ct-status-new",
  preparing: "ct-status-badge ct-status-preparing",
  ready: "ct-status-badge ct-status-ready",
  delivered: "ct-status-badge ct-status-delivered",
  cancelled: "ct-status-badge ct-status-cancelled",
};

export function orderStatusBadgeClass(statusKey) {
  return ORDER_STATUS_BADGE[statusKey] ?? "ct-status-badge ct-status-muted";
}

const RESERVATION_STATUS_BADGE = {
  pending: "ct-status-badge ct-status-new",
  confirmed: "ct-status-badge ct-status-ready",
  completed: "ct-status-badge ct-status-delivered",
  cancelled: "ct-status-badge ct-status-cancelled",
};

export function reservationStatusBadgeClass(status) {
  const key = String(status ?? "").toLowerCase();
  return RESERVATION_STATUS_BADGE[key] ?? "ct-status-badge ct-status-muted";
}

export function formatReservationStatusLabel(status) {
  const key = String(status ?? "").toLowerCase();
  if (!key) return "Unknown";
  return key.charAt(0).toUpperCase() + key.slice(1);
}
