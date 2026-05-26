/**
 * Restaurant CMS defaults — client-safe (no MongoDB).
 */

import {
  DEFAULT_ABOUT_EXTRAS,
  DEFAULT_BOOKING_PAGE,
  DEFAULT_CONTACT_PAGE,
  DEFAULT_HOME_SECTIONS,
  DEFAULT_MENU_LABELS,
} from "./customerCmsExtendedDefaults";
import { DEFAULT_CUSTOMER_THEME } from "./customerThemeDefaults";

export const DEFAULT_BANNERS = [
  {
    id: 1,
    enabled: true,
    title: "Budget Feast",
    subtitle: "Best deals of the day — limited time offer",
    badge: "Hot Deal",
    discount: "20% OFF",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=90",
    ctaLabel: "Order Now",
    ctaLink: "/order/menu",
    secondaryCtaLabel: "View Menu",
    secondaryCtaLink: "/order/menu",
  },
  {
    id: 2,
    enabled: true,
    title: "Chef's Special",
    subtitle: "Freshly crafted every morning by our head chef",
    badge: "Chef's Pick",
    discount: "",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1400&q=90",
    ctaLabel: "View Menu",
    ctaLink: "/order/menu",
    secondaryCtaLabel: "",
    secondaryCtaLink: "",
  },
  {
    id: 3,
    enabled: true,
    title: "Book a Table",
    subtitle: "Reserve your spot for a premium dining experience",
    badge: "Reserve",
    discount: "",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=90",
    ctaLabel: "Book Now",
    ctaLink: "/order/table-booking",
    secondaryCtaLabel: "",
    secondaryCtaLink: "",
  },
];

export const DEFAULT_PROMO_SLIDE_IMAGE = DEFAULT_BANNERS[0]?.image ?? "";

const DEFAULT_HERO_THUMBNAILS = [
  {
    label: "Pizza",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80",
  },
  {
    label: "Salad",
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&q=80",
  },
  {
    label: "Dessert",
    imageUrl: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&q=80",
  },
];

const DEFAULT_HERO_PILLS = [
  { label: "Burgers", query: "burger" },
  { label: "Pizza", query: "pizza" },
  { label: "Pasta", query: "pasta" },
  { label: "Salads", query: "salad" },
  { label: "Drinks", query: "drink" },
];

export const DEFAULTS = {
  hero: {
    badge: "Chef Crafted · Fresh · Premium",
    headline: "Delicious Food, Delivered to Your Door",
    subheadline:
      "Explore our kitchen specials, book a table, or order for takeaway and delivery — all in one seamless experience.",
    ctaPrimaryLabel: "Order Now",
    ctaPrimaryLink: "",
    ctaSecondaryLabel: "Book a Table",
    ctaSecondaryLink: "/order/table-booking",
    imageUrl: "",
    thumbnails: DEFAULT_HERO_THUMBNAILS,
    overlayBadge: "Chef's Special",
    showMenuDishOverlay: false,
    floatingCard: {
      enabled: true,
      title: "200+ orders today",
      subtitle: "+12% this week",
    },
    searchEnabled: true,
    searchPlaceholder: "Search for dishes, burgers, pizza...",
    searchButtonLabel: "Search",
    quickPillsEnabled: true,
    quickPills: DEFAULT_HERO_PILLS,
  },
  announcement: {
    enabled: false,
    text: "🎉 Special offer today! Get 20% off on all orders above ₹500.",
    bgColor: "#FF6B35",
    textColor: "#ffffff",
    link: "",
    linkLabel: "",
  },
  about: {
    headline: "Our Story",
    description:
      "We started with a simple mission — to serve fresh, delicious food with warm hospitality. Every dish is crafted with love and the finest ingredients.",
    imageUrl: "",
    sideImages: [
      { imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80" },
      { imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" },
      { imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=80" },
    ],
    promises: [
      "Fresh ingredients every day",
      "No artificial preservatives",
      "Locally sourced produce",
      "Hygienic kitchen standards",
      "Friendly & fast service",
      "Dine-in, Takeaway & Delivery",
    ],
    stats: [
      { value: "50+", label: "Menu Items" },
      { value: "4.9★", label: "Rating" },
      { value: "2K+", label: "Happy Customers" },
    ],
    ctaPrimaryLabel: "View Menu",
    ctaPrimaryLink: "/order/menu",
    ctaSecondaryLabel: "Book a Table",
    ctaSecondaryLink: "/order/table-booking",
    ...DEFAULT_ABOUT_EXTRAS,
  },
  home: { ...DEFAULT_HOME_SECTIONS },
  contact: { ...DEFAULT_CONTACT_PAGE },
  booking: { ...DEFAULT_BOOKING_PAGE },
  menu: { ...DEFAULT_MENU_LABELS },
  theme: { ...DEFAULT_CUSTOMER_THEME },
  banners: DEFAULT_BANNERS,
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
    whatsapp: "",
    youtube: "",
  },
};

export const VALID_SECTIONS = Object.keys(DEFAULTS);

export function getActiveBanners(banners) {
  if (!Array.isArray(banners)) return [];
  return banners.filter((b) => b && b.enabled !== false && (b.title?.trim() || b.image?.trim()));
}

export const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80";

export const DEFAULT_ABOUT_MAIN_IMAGE =
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=85";

export const DEFAULT_ABOUT_SIDE_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80";
