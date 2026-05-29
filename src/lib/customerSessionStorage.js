const SESSION_PREFIX = "rms_customer_session";
const ORDER_TYPES = new Set(["dine-in", "takeaway", "delivery"]);

function sessionKey(scope) {
  return `${SESSION_PREFIX}_${scope || "default"}`;
}

function parseSlugFromPathname(pathname) {
  const match = String(pathname ?? "").match(/^\/r\/([^/]+)(\/|$)/);
  return match ? match[1] : null;
}

function parseSlugFromCookie() {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("x-restaurant-slug="));
  if (!raw) return null;
  try {
    return decodeURIComponent(raw.split("=")[1] ?? "");
  } catch {
    return null;
  }
}

/** Per-restaurant scope so carts do not mix between tenants. */
export function getCustomerStorageScope(pathname) {
  return parseSlugFromPathname(pathname) || parseSlugFromCookie() || "default";
}

/** One-time migration from older global order-type key. */
export function migrateLegacyCustomerSession(scope) {
  if (typeof window === "undefined") return;
  if (readCustomerSession(scope)) return;
  const legacyType = sessionStorage.getItem("customer_order_type");
  if (ORDER_TYPES.has(legacyType)) {
    writeCustomerSession(scope, { orderType: legacyType });
    sessionStorage.removeItem("customer_order_type");
  }
}

export function readCustomerSession(scope) {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(sessionKey(scope));
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
}

export function writeCustomerSession(scope, partial) {
  if (typeof window === "undefined") return;
  const current = readCustomerSession(scope) || {};
  const next = { ...current, ...partial };
  try {
    sessionStorage.setItem(sessionKey(scope), JSON.stringify(next));
  } catch {
    /* quota exceeded — ignore */
  }
}

export function readStoredOrderType(scope) {
  const type = readCustomerSession(scope)?.orderType;
  return ORDER_TYPES.has(type) ? type : null;
}

export function writeStoredOrderType(scope, type) {
  if (type && ORDER_TYPES.has(type)) {
    writeCustomerSession(scope, { orderType: type });
  } else {
    const current = readCustomerSession(scope) || {};
    const next = { ...current };
    delete next.orderType;
    if (typeof window !== "undefined") {
      sessionStorage.setItem(sessionKey(scope), JSON.stringify(next));
    }
  }
}

function normalizeCartLine(line) {
  if (!line?.id || !String(line.name ?? "").trim()) return null;
  const price = Number(line.price);
  const qty = Math.max(1, parseInt(line.qty, 10) || 1);
  if (!Number.isFinite(price) || price < 0) return null;
  return {
    id: String(line.id),
    name: String(line.name).trim(),
    price,
    qty,
    image: line.image ?? null,
    itemType: line.itemType ?? null,
    prepTime: line.prepTime ?? null,
  };
}

export function readStoredCartLines(scope) {
  const cart = readCustomerSession(scope)?.cart;
  if (!Array.isArray(cart)) return [];
  return cart.map(normalizeCartLine).filter(Boolean);
}

export function writeStoredCartLines(scope, lines) {
  const cart = Array.isArray(lines)
    ? lines.map(normalizeCartLine).filter(Boolean)
    : [];
  writeCustomerSession(scope, { cart });
}

const CUSTOMER_FIELDS = ["name", "phone", "email", "address", "tableNumber"];

export function readStoredCustomerDraft(scope) {
  const raw = readCustomerSession(scope)?.customer;
  if (!raw || typeof raw !== "object") return null;
  const draft = {};
  for (const key of CUSTOMER_FIELDS) {
    if (raw[key] != null) draft[key] = String(raw[key]);
  }
  return draft;
}

export function writeStoredCustomerDraft(scope, customer) {
  if (!customer || typeof customer !== "object") return;
  const draft = {};
  for (const key of CUSTOMER_FIELDS) {
    draft[key] = String(customer[key] ?? "");
  }
  writeCustomerSession(scope, { customer: draft });
}

export function clearCustomerSession(scope) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(sessionKey(scope));
}
