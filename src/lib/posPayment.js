/** POS payment defaults and helpers — order-type aware (no gateway charge here). */

export const POS_TAKEAWAY_METHODS = [
  { id: "cashCounter", label: "Cash" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
];

export const POS_DELIVERY_METHODS = [
  { id: "cod", label: "COD" },
  { id: "upi", label: "UPI" },
  { id: "card", label: "Card" },
];

export function getPosPaymentDefaults(orderType) {
  switch (orderType) {
    case "dine-in":
      return { paymentMethod: "payLater", paymentStatus: "pending" };
    case "takeaway":
      return { paymentMethod: "cashCounter", paymentStatus: "paid" };
    case "delivery":
      return { paymentMethod: "cod", paymentStatus: "pending" };
    default:
      return { paymentMethod: "cashCounter", paymentStatus: "paid" };
  }
}

export function getPosPaymentMethods(orderType) {
  if (orderType === "takeaway") return POS_TAKEAWAY_METHODS;
  if (orderType === "delivery") return POS_DELIVERY_METHODS;
  return [];
}

/** Whether staff should pick method/status in the POS UI before placing the order. */
export function shouldShowPosPaymentUI(orderType) {
  return orderType === "takeaway" || orderType === "delivery";
}

export function resolvePosPaymentStatus(paymentMethod, orderType) {
  if (paymentMethod === "cod" || paymentMethod === "payLater") return "pending";
  if (orderType === "delivery") return "paid";
  if (orderType === "takeaway") return "paid";
  return "pending";
}

export function canEditPosPaymentStatus(orderType, paymentMethod) {
  if (orderType === "takeaway") return true;
  if (orderType === "delivery" && paymentMethod !== "cod") return true;
  return false;
}

export function getPosPaymentHint(orderType) {
  if (orderType === "dine-in") {
    return "Payment is collected at bill time — no need to ask the customer now.";
  }
  if (orderType === "takeaway") {
    return "Select how the customer is paying at the counter.";
  }
  if (orderType === "delivery") {
    return "COD stays pending until delivery. UPI/Card is usually paid upfront.";
  }
  return "";
}
