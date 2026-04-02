export const SETTINGS_TABS = [
  { id: "general", label: "General" },
  { id: "pos", label: "POS & Charges" },
  { id: "notifications", label: "Notifications" },
  { id: "hours", label: "Opening Hours" },
  { id: "contact", label: "Contact" },
];

export const DEFAULT_SETTINGS = {
  general: {
    restaurantName: "Olive & Ember Bistro",
    logoName: "",
    currency: "USD",
    timezone: "Asia/Kolkata",
    language: "English",
  },
  pos: {
    taxPercentage: "8",
    serviceCharge: "5",
    enableDiscount: true,
    enableTips: true,
    roundOffTotal: true,
  },
  notifications: {
    orderNotifications: true,
    reservationAlerts: true,
    lowStockAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
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
    phoneNumber: "+91 98765 43210",
    email: "hello@oliveember.demo",
    address: "21 Market Road, Bengaluru, Karnataka",
    googleMapsLink: "https://maps.google.com/?q=21+Market+Road+Bengaluru",
  },
};

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "INR", "AED"];
export const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "UTC",
  "Europe/London",
  "America/New_York",
];
export const LANGUAGE_OPTIONS = ["English", "Hindi", "Arabic", "Spanish"];
