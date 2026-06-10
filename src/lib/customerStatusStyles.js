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
