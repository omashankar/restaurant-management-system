import clientPromise from "@/lib/mongodb";

/** Defaults mirror super-admin settings API — keep in sync when adding fields. */
export const PLATFORM_DEFAULTS = {
  app: {
    name: "RMS Platform",
    legalName: "",
    logoUrl: "",
    faviconUrl: "",
    supportEmail: "support@rms.com",
    contactPhone: "",
    address: "",
  },
  email: {
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    fromName: "RMS Platform",
    fromEmail: "",
    secure: false,
  },
  language: {
    defaultLanguage: "en",
    timezone: "UTC",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",
  },
  payment: {
    currency: "INR",
    trialDays: 14,
    taxPercent: 0,
  },
  theme: {
    primaryColor: "#10b981",
    accentColor: "#f43f5e",
    darkMode: true,
  },
  notifications: {
    newRestaurantAlert: true,
    paymentFailAlert: true,
    weeklyReport: false,
    systemAlerts: true,
    pushEnabled: false,
  },
  currencies: {
    default: "INR",
    supported: ["INR", "USD", "EUR", "GBP"],
  },
  sms: {
    provider: "twilio",
    apiKey: "",
    authToken: "",
    senderId: "",
    enabled: false,
  },
  security: {
    minPasswordLength: 8,
    requireSpecialChars: true,
    requireNumbers: true,
    loginAttemptLimit: 5,
    blockDurationMinutes: 30,
    enable2FA: false,
    sessionTimeoutMinutes: 60,
    ipWhitelist: "",
  },
  integrations: {
    googleAnalyticsId: "",
    metaPixelId: "",
    webhookUrl: "",
    webhookSecret: "",
  },
  advanced: {
    maintenanceMode: false,
    debugMode: false,
    invoicePrefix: "INV-",
    autoBilling: true,
    featureMenuQR: true,
    featureOnlineOrder: true,
    featureReservations: true,
    featureInventory: true,
  },
};

let _cache = null;
let _cacheTime = 0;
const CACHE_TTL_MS = 60_000;

export function invalidatePlatformSettingsCache() {
  _cache = null;
  _cacheTime = 0;
}

/**
 * Full merged platform settings (server-only; includes secrets).
 * @param {import("mongodb").Db} [db]
 */
export async function getPlatformSettings(db) {
  const now = Date.now();
  if (_cache && now - _cacheTime < CACHE_TTL_MS) return _cache;

  let database = db;
  if (!database) {
    const client = await clientPromise;
    database = client.db();
  }

  const doc = await database.collection("settings").findOne({ _id: "platform" });
  const merged = {};
  for (const section of Object.keys(PLATFORM_DEFAULTS)) {
    merged[section] = {
      ...PLATFORM_DEFAULTS[section],
      ...(doc?.[section] ?? {}),
    };
  }

  _cache = merged;
  _cacheTime = now;
  return merged;
}

/** Safe subset for client / middleware (no secrets). */
export async function getPublicPlatformConfig(db) {
  const s = await getPlatformSettings(db);
  const adv = s.advanced ?? {};
  return {
    maintenanceMode: Boolean(adv.maintenanceMode),
    appName: s.app?.name ?? "RMS Platform",
    supportEmail: s.app?.supportEmail ?? "",
    features: {
      featureMenuQR: adv.featureMenuQR !== false,
      featureOnlineOrder: adv.featureOnlineOrder !== false,
      featureReservations: adv.featureReservations !== false,
      featureInventory: adv.featureInventory !== false,
    },
    currency: s.payment?.currency ?? s.currencies?.default ?? "INR",
    supportedCurrencies: s.currencies?.supported ?? ["INR"],
    language: s.language?.defaultLanguage ?? "en",
    timezone: s.language?.timezone ?? "UTC",
    dateFormat: s.language?.dateFormat ?? "MM/DD/YYYY",
    timeFormat: s.language?.timeFormat ?? "12h",
    theme: {
      primaryColor: s.theme?.primaryColor ?? "#10b981",
      accentColor: s.theme?.accentColor ?? "#f43f5e",
      darkMode: s.theme?.darkMode !== false,
    },
    integrations: {
      googleAnalyticsId: String(s.integrations?.googleAnalyticsId ?? "").trim(),
      metaPixelId: String(s.integrations?.metaPixelId ?? "").trim(),
    },
    debugMode: Boolean(adv.debugMode),
  };
}

export function getPlatformFeatures(settings) {
  const adv = settings?.advanced ?? PLATFORM_DEFAULTS.advanced;
  return {
    featureMenuQR: adv.featureMenuQR !== false,
    featureOnlineOrder: adv.featureOnlineOrder !== false,
    featureReservations: adv.featureReservations !== false,
    featureInventory: adv.featureInventory !== false,
  };
}
