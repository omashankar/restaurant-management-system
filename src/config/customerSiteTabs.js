import {

  LayoutGrid,

  Sparkles,

  Megaphone,

  Layers,

  Info,

  LayoutList,

  Phone,

  CalendarClock,

  UtensilsCrossed,

  Palette,

} from "lucide-react";



export const CUSTOMER_SITE_TABS = [

  {

    id: "overview",

    label: "Overview",

    icon: LayoutGrid,

    headline: "What you can customize",

    description: "All customer-facing copy and images for your public site.",

    pages: ["All customer pages"],

  },

  {

    id: "theme",

    label: "Website layout",

    icon: Palette,

    headline: "Website layout",

    description: "Colors, font, favicon, header, footer, logos, and social links.",

    pages: ["All customer pages"],

    saveSection: "theme",

  },

  {

    id: "hero",

    label: "Hero",

    icon: Sparkles,

    headline: "Home — hero",

    description: "Main headline, text, buttons, and large hero image.",

    pages: ["Home (top)"],

    saveSection: "hero",

  },

  {

    id: "announcement",

    label: "Top banner",

    icon: Megaphone,

    headline: "Offer strip",

    description: "Optional colored bar at the top of the home page.",

    pages: ["Home"],

    saveSection: "announcement",

  },

  {

    id: "banners",

    label: "Promo slider",

    icon: Layers,

    headline: "Promo slider",

    description: "Rotating slides with your images and offers.",

    pages: ["Home"],

    saveSection: "banners",

  },

  {

    id: "home",

    label: "Home sections",

    icon: LayoutList,

    headline: "Home — lower sections",

    description: "Order types, steps, reviews, section titles, bottom CTA.",

    pages: ["Home"],

    saveSection: "home",

  },

  {

    id: "about",

    label: "About",

    icon: Info,

    headline: "About page",

    description: "Story, images, stats, features, visit block, CTAs.",

    pages: ["About", "Home stats"],

    saveSection: "about",

  },

  {

    id: "contact",

    label: "Contact",

    icon: Phone,

    headline: "Contact page",

    description: "Headings and form labels.",

    pages: ["Contact"],

    saveSection: "contact",

  },

  {

    id: "booking",

    label: "Booking",

    icon: CalendarClock,

    headline: "Table booking",

    description: "Booking flow labels.",

    pages: ["Book Table"],

    saveSection: "booking",

  },

  {

    id: "menu",

    label: "Menu page",

    icon: UtensilsCrossed,

    headline: "Menu page text",

    description: "Menu UI labels (not dishes).",

    pages: ["Menu"],

    saveSection: "menu",

  },

];



/** FoodLay-style grouped sidebar */

export const CUSTOMER_SITE_NAV_GROUPS = [

  { id: "setup", label: "Website setup", tabIds: ["overview", "theme"] },

  { id: "home", label: "Home page", tabIds: ["hero", "announcement", "banners", "home"] },

  { id: "pages", label: "Pages", tabIds: ["about", "contact", "booking", "menu"] },

];



export const CUSTOMER_SITE_TABS_BY_ID = Object.fromEntries(

  CUSTOMER_SITE_TABS.map((t) => [t.id, t])

);



export const CUSTOMER_SITE_TAB_IDS = CUSTOMER_SITE_TABS.map((t) => t.id);



export function getCustomerSiteTab(id) {

  return CUSTOMER_SITE_TABS.find((t) => t.id === id) ?? CUSTOMER_SITE_TABS[0];

}


