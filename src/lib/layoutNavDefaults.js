/** Default header/footer navigation — matches RMS customer routes. */

export const DEFAULT_HEADER_MENU = [
  { id: "home", label: "Home", path: "/home", enabled: true },
  { id: "menu", label: "Menu", path: "/order/menu", enabled: true },
  { id: "booking", label: "Book Table", path: "/order/table-booking", enabled: true },
  { id: "about", label: "About", path: "/order/about", enabled: true },
  { id: "contact", label: "Contact", path: "/order/contact", enabled: true },
];

export const DEFAULT_FOOTER_QUICK_LINKS = [
  { id: "menu", label: "Our Menu", path: "/order/menu", enabled: true },
  { id: "booking", label: "Book a Table", path: "/order/table-booking", enabled: true },
  { id: "about", label: "About Us", path: "/order/about", enabled: true },
  { id: "contact", label: "Contact", path: "/order/contact", enabled: true },
  { id: "privacy", label: "Privacy Policy", path: "/order/privacy", enabled: true },
  { id: "terms", label: "Terms & Conditions", path: "/order/terms", enabled: true },
];

export const DEFAULT_FOOTER_ACCOUNT_LINKS = [
  { id: "profile", label: "Profile", path: "/account/dashboard?tab=profile", enabled: true },
  { id: "orders", label: "My Orders", path: "/account/dashboard?tab=orders", enabled: true },
  { id: "reservations", label: "Reservations", path: "/account/dashboard?tab=bookings", enabled: true },
];

export const DEFAULT_FOOTER_SOCIAL_LINKS = [
  { id: "instagram", label: "Instagram", url: "", enabled: true },
  { id: "facebook", label: "Facebook", url: "", enabled: true },
  { id: "twitter", label: "Twitter", url: "", enabled: true },
  { id: "whatsapp", label: "WhatsApp", url: "", enabled: true },
  { id: "youtube", label: "YouTube", url: "", enabled: true },
];

export function newNavItem(label = "New link") {
  return {
    id: `item-${Date.now()}`,
    label,
    path: "/order/contact",
    enabled: true,
  };
}

export function newSocialItem(label = "Link") {
  return {
    id: `social-${Date.now()}`,
    label,
    url: "",
    enabled: true,
  };
}

export function ensureNavItems(list, fallback) {
  if (Array.isArray(list) && list.length > 0) return list;
  return fallback.map((i) => ({ ...i }));
}

export function activeNavItems(list, fallback) {
  return ensureNavItems(list, fallback).filter((i) => i.enabled !== false && (i.path?.trim() || i.url?.trim()));
}
