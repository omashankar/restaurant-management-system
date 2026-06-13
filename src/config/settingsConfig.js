import { BHOJDESK_LOGOS, BHOJDESK_PLATFORM_UI } from "@/config/bhojdeskBrand";
import {
  Bell,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Palette,
  Receipt,
  Settings,
  Shield,
  ShoppingCart,
} from "lucide-react";
import { DEFAULT_ACCESS_CONTROL } from "./accessControlConfig";

/** Shown in admin UI when General → name/logo are empty (not written to DB). */
export const RESTAURANT_PLATFORM_BRANDING = BHOJDESK_PLATFORM_UI;
export const RESTAURANT_PLATFORM_LOGO = BHOJDESK_LOGOS.icon;

/**
 * Restaurant Admin settings — single source for sidebar labels/icons
 * and matching panel section headers (Super Admin pattern).
 */
export const SETTINGS_TABS = [
  { id: "general", label: "General", Icon: Settings, adminOnly: false },
  { id: "pos", label: "POS & Charges", Icon: ShoppingCart, adminOnly: false },
  { id: "payments", label: "Payments", Icon: CreditCard, adminOnly: false },
  { id: "billing", label: "Billing Info", Icon: Receipt, adminOnly: false },
  { id: "accessControl", label: "Access Control", Icon: Shield, adminOnly: false },
  { id: "email", label: "Email / SMTP", Icon: Mail, adminOnly: true },
  { id: "hours", label: "Opening Hours", Icon: Clock, adminOnly: false },
  { id: "contact", label: "Contact", Icon: MapPin, adminOnly: false },
  { id: "theme", label: "Theme", Icon: Palette, adminOnly: true },
];

/** Panel section headers — keyed by tab id or `tabId.sectionKey` for multi-section tabs */
export const SETTINGS_PANEL_SECTIONS = {
  general: {
    title: "General Settings",
    description: "Basic profile and localization for your restaurant.",
    Icon: Settings,
  },
  "general.notifications": {
    title: "Notifications",
    description:
      "Control in-app inbox alerts and optional email/SMS alerts for new orders. SMS alerts use WhatsApp — configure credentials under WhatsApp menu.",
    Icon: Bell,
  },
  pos: {
    title: "POS & Charges",
    description: "Control pricing behavior and order calculations.",
    Icon: ShoppingCart,
  },
  payments: {
    title: "Payment Gateway",
    description: "Select a gateway and enter your API keys. Keys are encrypted before saving.",
    Icon: CreditCard,
  },
  "billing.bank": {
    title: "Bank Account Details",
    description:
      "Your settlement payouts will be sent to this account. Sensitive fields are masked for security.",
    Icon: Receipt,
  },
  "billing.tax": {
    title: "Tax Settings",
    description: "Configure GST and tax details. These are applied automatically during checkout.",
    Icon: Receipt,
  },
  email: {
    title: "Email / SMTP",
    description:
      "Verification and password-reset emails for your restaurant accounts use this server when enabled; otherwise Super Admin SMTP or server env Gmail is used.",
    Icon: Mail,
  },
  accessControl: {
    title: "Access Control",
    description:
      "Set feature access by role. Changes apply to new sessions; existing sessions may need re-login.",
    Icon: Shield,
  },
  hours: {
    title: "Opening Hours",
    description: "Set your weekly operating schedule.",
    Icon: Clock,
  },
  contact: {
    title: "Contact Details",
    description: "Public-facing contact and location settings.",
    Icon: MapPin,
  },
  theme: {
    title: "Theme",
    description:
      "Primary Color drives your admin panel — sidebar, buttons, loaders. Accent is for success states (paid, active, online).",
    Icon: Palette,
  },
};

export function getSettingsTab(tabId) {
  return SETTINGS_TABS.find((tab) => tab.id === tabId) ?? null;
}

export function getSettingsPanelSection(sectionId) {
  return SETTINGS_PANEL_SECTIONS[sectionId] ?? null;
}

export function resolveSettingsPanelSection(sectionId, overrides = {}) {
  const base = getSettingsPanelSection(sectionId) ?? {};
  return {
    title: overrides.title ?? base.title ?? "",
    description: overrides.description ?? base.description ?? "",
    Icon: overrides.icon ?? overrides.Icon ?? base.Icon ?? Settings,
  };
}

export function filterSettingsTabsForRole(role) {
  const isAdmin = role === "admin";
  return SETTINGS_TABS.filter((tab) => isAdmin || !tab.adminOnly);
}

export const EMPTY_SETTINGS = {
  general: {
    restaurantName: "",
    logoUrl: "",
    currency: "USD",
    timezone: "UTC",
    language: "English",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
  },
  pos: {
    taxPercentage: "0",
    serviceCharge: "0",
    enableDiscount: false,
    enableTips: false,
    roundOffTotal: false,
  },
  paymentMethods: {
    defaultMethod: "cod",
    cod: true,
    cashCounter: true,
    upi: true,
    card: true,
    netBanking: true,
    wallet: true,
    payLater: false,
    bankTransfer: false,
  },
  notifications: {
    orderNotifications: true,
    reservationAlerts: true,
    lowStockAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
  },
  email: {
    enabled: false,
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromName: "",
    fromEmail: "",
    secure: false,
  },
  openingHours: [
    { day: "Monday", openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Tuesday", openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Wednesday", openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Thursday", openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Friday", openTime: "09:00", closeTime: "23:00", closed: false },
    { day: "Saturday", openTime: "10:00", closeTime: "23:00", closed: false },
    { day: "Sunday", openTime: "10:00", closeTime: "21:00", closed: false },
  ],
  contact: {
    phoneNumber: "",
    email: "",
    address: "",
    googleMapsLink: "",
  },
  theme: {
    primaryColor: "#10b981",
    accentColor: "#34d399",
    darkMode: true,
  },
  accessControl: DEFAULT_ACCESS_CONTROL,
};

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "AED"];
export const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "UTC",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
];
export const LANGUAGE_OPTIONS = ["English"];

/** Stored as English only (UI is not localized). */
export const PANEL_LANGUAGE_OPTIONS = ["English"];

export const DATE_FORMAT_OPTIONS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];

export const TIME_FORMAT_OPTIONS = [
  { value: "12h", label: "12-hour (AM/PM)" },
  { value: "24h", label: "24-hour" },
];

export function normalizeDateFormat(format) {
  const value = String(format ?? "").trim();
  return DATE_FORMAT_OPTIONS.includes(value) ? value : EMPTY_SETTINGS.general.dateFormat;
}

export function normalizeTimeFormat(format) {
  const value = String(format ?? "").trim();
  return TIME_FORMAT_OPTIONS.some((opt) => opt.value === value) ? value : EMPTY_SETTINGS.general.timeFormat;
}

export function normalizePanelLanguage() {
  return "English";
}

export function panelLanguageToCode() {
  return "en";
}

export function panelLanguageFromCode() {
  return "English";
}
