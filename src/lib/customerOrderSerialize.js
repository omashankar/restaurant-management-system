import { buildOrderTimeline, normalizeCustomerOrderStatus } from "@/lib/customerOrderStatus";

export const CUSTOMER_ORDER_TYPE_LABEL = {
  "dine-in": "Dine-In",
  takeaway: "Takeaway",
  delivery: "Delivery",
};

export const CUSTOMER_PAYMENT_METHOD_LABEL = {
  cod: "Cash on Delivery",
  cashCounter: "Cash at Counter",
  upi: "UPI",
  card: "Card",
  debitCard: "Debit Card",
  netBanking: "Net Banking",
  wallet: "Wallet",
  payLater: "Pay Later",
  bankTransfer: "Bank Transfer",
};

export const CUSTOMER_PAYMENT_STATUS_LABEL = {
  paid: "Paid",
  pending: "Pending",
  initiated: "Processing",
  processing: "Processing",
  failed: "Failed",
};

function mapLineItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it) => {
    const price = Number(it.price ?? 0);
    const qty = Number(it.qty ?? 0);
    const note = String(it.note ?? "").trim();
    return {
      id: String(it.id ?? it.menuItemId ?? ""),
      name: String(it.name ?? ""),
      price,
      qty,
      note: note || null,
      lineTotal: Number((price * qty).toFixed(2)),
    };
  });
}

function paymentMethodLabel(method) {
  const key = String(method ?? "").trim();
  return CUSTOMER_PAYMENT_METHOD_LABEL[key] ?? (key ? key : "—");
}

function paymentStatusLabel(status) {
  const key = String(status ?? "").trim().toLowerCase();
  return CUSTOMER_PAYMENT_STATUS_LABEL[key] ?? (key ? key : "Pending");
}

function orderTypeLabel(orderType) {
  return CUSTOMER_ORDER_TYPE_LABEL[String(orderType ?? "").trim()] ?? "Order";
}

function canCancelOrder(rawStatus) {
  return ["new", "pending"].includes(String(rawStatus ?? "").toLowerCase());
}

function isActiveOrder(statusKey) {
  return !["completed", "cancelled"].includes(statusKey);
}

/** List row for dashboard / orders API */
export function serializeCustomerOrderListItem(order) {
  const meta = normalizeCustomerOrderStatus(order.status);
  return {
    id: String(order._id),
    orderId: order.orderId ?? "",
    orderType: order.orderType ?? "",
    orderTypeLabel: orderTypeLabel(order.orderType),
    total: Number(order.total ?? 0),
    status: order.status ?? "",
    statusKey: meta.key,
    statusLabel: meta.label,
    statusEmoji: meta.emoji,
    createdAt: order.createdAt ?? null,
    paymentMethod: order.payment?.method ?? "",
    paymentStatus: order.payment?.status ?? "",
  };
}

/** Full detail for order detail page API */
export function serializeCustomerOrderDetail(order) {
  const meta = normalizeCustomerOrderStatus(order.status);
  const rawStatus = String(order.status ?? "").toLowerCase();
  const lineItems = mapLineItems(order.items);
  const subtotal = Number(order.subtotal ?? lineItems.reduce((s, l) => s + l.lineTotal, 0));
  const tax = Number(order.tax ?? order.taxAmount ?? 0);
  const serviceCharge = Number(order.serviceCharge ?? 0);
  const deliveryCharge = Number(order.deliveryCharge ?? 0);
  const couponDiscount = Number(order.couponDiscount ?? 0);
  const pointsDiscount = Number(order.pointsDiscount ?? 0);
  const total = Number(order.total ?? subtotal + tax + serviceCharge + deliveryCharge);

  const customerInfo = order.customerInfo ?? {};
  const paymentMethod = order.payment?.method ?? "";
  const paymentStatus = order.payment?.status ?? "";

  return {
    id: String(order._id),
    orderId: order.orderId ?? "",
    orderType: order.orderType ?? "",
    orderTypeLabel: orderTypeLabel(order.orderType),
    tableNumber: order.tableNumber ?? "",
    customerName: String(customerInfo.name ?? order.customer ?? "").trim(),
    customerPhone: String(customerInfo.phone ?? "").trim(),
    customerEmail: String(customerInfo.email ?? "").trim(),
    deliveryAddress: String(customerInfo.address ?? order.address ?? "").trim(),
    status: order.status ?? "",
    statusKey: meta.key,
    statusLabel: meta.label,
    statusEmoji: meta.emoji,
    paymentMethod,
    paymentMethodLabel: paymentMethodLabel(paymentMethod),
    paymentStatus,
    paymentStatusLabel: paymentStatusLabel(paymentStatus),
    notes: String(order.notes ?? "").trim(),
    createdAt: order.createdAt ?? null,
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    taxPercent: Number(order.taxPercentage ?? order.taxPercent ?? 0),
    serviceCharge: Number(serviceCharge.toFixed(2)),
    serviceChargePercent: Number(order.serviceChargePercent ?? 0),
    deliveryCharge: Number(deliveryCharge.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    pointsDiscount: Number(pointsDiscount.toFixed(2)),
    total: Number(total.toFixed(2)),
    itemCount: lineItems.reduce((sum, line) => sum + line.qty, 0),
    items: lineItems,
    timeline: buildOrderTimeline(meta.key),
    canCancel: canCancelOrder(rawStatus),
    canReorder: lineItems.length > 0 && meta.key !== "cancelled",
    isActive: isActiveOrder(meta.key),
  };
}

export function timelineStepCaption(state) {
  if (state === "current") return "In progress";
  if (state === "done") return "Completed";
  if (state === "bad") return "Stopped";
  if (state === "skipped") return "—";
  return "Waiting";
}
