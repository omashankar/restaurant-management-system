/** Default customer-site theme (Website layout). */

import {
  DEFAULT_FOOTER_ACCOUNT_LINKS,
  DEFAULT_FOOTER_QUICK_LINKS,
  DEFAULT_FOOTER_SOCIAL_LINKS,
  DEFAULT_HEADER_MENU,
} from "@/lib/layoutNavDefaults";

export const DEFAULT_CUSTOMER_THEME = {
  primaryColor: "#FF6B35",
  secondaryColor: "#FF9F1C",
  fontFamily: "Inter, system-ui, sans-serif",
  colorMode: "light",
  faviconUrl: "",
  header: {
    sticky: true,
    logoUrl: "",
    logoDarkUrl: "",
    showBrandText: false,
    showLocationBar: true,
    locationLabel: "",
    showSearch: true,
    colors: {
      background: "#ffffff",
      font: "#333333",
      icon: "#9c9c9c",
    },
    menuItems: DEFAULT_HEADER_MENU.map((i) => ({ ...i })),
  },
  footer: {
    colors: {
      background: "#111827",
      font: "#ffffff",
    },
    logoUrl: "",
    showDescription: true,
    tagline: "",
    showOpeningHours: true,
    showAppDownload: false,
    showAppleStore: true,
    showPlayStore: true,
    appStoreUrl: "",
    playStoreUrl: "",
    showNewsletter: true,
    newsletterTitle: "Subscribe to our Newsletter",
    newsletterSubtitle: "Stay up to date with our latest offers and new dishes.",
    newsletterPlaceholder: "Enter your email",
    showQuickLinks: true,
    quickLinks: DEFAULT_FOOTER_QUICK_LINKS.map((i) => ({ ...i })),
    showAccountLinks: true,
    accountLinks: DEFAULT_FOOTER_ACCOUNT_LINKS.map((i) => ({ ...i })),
    showSocialLinks: true,
    socialLinks: DEFAULT_FOOTER_SOCIAL_LINKS.map((i) => ({ ...i })),
    showCopyright: true,
    copyrightText: "",
    helpTitle: "Need Help?",
    helpSubtitle: "We're here for you anytime.",
    copyrightNote: "",
  },
};

export const CUSTOMER_FONT_OPTIONS = [
  { value: "Inter, system-ui, sans-serif", label: "Inter" },
  { value: "Poppins, system-ui, sans-serif", label: "Poppins" },
  { value: "DM Sans, system-ui, sans-serif", label: "DM Sans" },
  { value: "Nunito, system-ui, sans-serif", label: "Nunito" },
  { value: "Roboto, system-ui, sans-serif", label: "Roboto" },
  { value: "Open Sans, system-ui, sans-serif", label: "Open Sans" },
];
