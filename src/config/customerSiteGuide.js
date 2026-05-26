/**
 * What restaurant owners can customize on the public customer site.
 * Used by Customer Site → Overview (keep in sync with CMS + Settings).
 */

/** Customer Site admin tabs → saved in restaurant_cms */
export const CUSTOMER_SITE_CMS_SECTIONS = [
  {
    id: "theme",
    label: "Website layout",
    where: "All customer pages",
    fields: "Colors, font, favicon, header & footer, logos, social URLs",
  },
  {
    id: "hero",
    label: "Home · Hero",
    where: "Home (top)",
    fields:
      "Badge, headline, subtext, search bar, quick tags, buttons & links, main + 3 small images (upload or URL), overlay badge, floating card",
  },
  {
    id: "announcement",
    label: "Top banner",
    where: "Home (top strip)",
    fields: "Offer text, colors, optional link",
  },
  {
    id: "banners",
    label: "Promo slider",
    where: "Home",
    fields: "Per slide: image (upload/URL), badge, title, subtitle, discount, primary & secondary buttons",
  },
  {
    id: "home",
    label: "Home · Sections",
    where: "Home (lower)",
    fields: "Order types, section titles, steps, reviews, bottom CTA",
  },
  {
    id: "about",
    label: "About",
    where: "About page + home stats",
    fields:
      "Story, images, promises, stats, features, visit block, CTAs",
  },
  {
    id: "contact",
    label: "Contact",
    where: "Contact page",
    fields: "Headings and form labels",
  },
  {
    id: "booking",
    label: "Booking",
    where: "Table booking",
    fields: "All booking step labels",
  },
  {
    id: "menu",
    label: "Menu labels",
    where: "Menu page",
    fields: "Search, cart, filters, buttons text",
  },
  {
    id: "social",
    label: "Social",
    where: "Navbar, footer",
    fields: "Instagram, Facebook, X, WhatsApp, YouTube",
  },
];

/** Settings app → restaurant_settings (not Customer Site tabs) */
export const SETTINGS_FOR_CUSTOMER_SITE = [
  { tab: "General", items: "Restaurant name, fallback logo, currency, timezone, language" },
  { tab: "Contact", items: "Address, phone, email, Google Maps link" },
  { tab: "Hours", items: "Opening hours (footer & contact)" },
  { tab: "Payments", items: "Payment methods customers see at checkout" },
];

/** Managed in other admin modules */
export const MANAGED_ELSEWHERE = [
  { module: "Menu → Items", items: "Dishes, prices, photos, availability" },
  { module: "Menu → Categories", items: "Category names & images (home browse row)" },
  { module: "Tables / Reservations", items: "Table booking" },
];

/** Platform / legal — link targets fixed; labels editable in Website layout → Header/Footer */
export const PLATFORM_PAGES = [
  "Privacy Policy & Terms (platform legal text)",
  "Default menu paths — customize labels in Website layout → Header menu & Footer links",
];
