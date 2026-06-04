import { DEFAULT_ACCESS_CONTROL } from "./accessControlConfig";
import {
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

export const SETTINGS_TABS = [
  { id: "general",       label: "General",       Icon: Settings },
  { id: "pos",           label: "POS & Charges", Icon: ShoppingCart },
  { id: "payments",      label: "Payments",      Icon: CreditCard },
  { id: "billing",       label: "Billing Info",  Icon: Receipt },
  { id: "accessControl", label: "Access Control", Icon: Shield },
  { id: "email",         label: "Email / SMTP",  Icon: Mail },
  { id: "hours",         label: "Opening Hours", Icon: Clock },
  { id: "contact",       label: "Contact",       Icon: MapPin },
  { id: "theme",         label: "Theme",         Icon: Palette },
];

export const EMPTY_SETTINGS = {
  general: {
    restaurantName: "",
    logoUrl: "",
    currency: "USD",
    timezone: "UTC",
    language: "English",
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
    { day: "Monday",    openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Tuesday",   openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Wednesday", openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Thursday",  openTime: "09:00", closeTime: "22:00", closed: false },
    { day: "Friday",    openTime: "09:00", closeTime: "23:00", closed: false },
    { day: "Saturday",  openTime: "10:00", closeTime: "23:00", closed: false },
    { day: "Sunday",    openTime: "10:00", closeTime: "21:00", closed: false },
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
export const LANGUAGE_OPTIONS = ["English", "Hindi", "Arabic", "Spanish", "French"];
