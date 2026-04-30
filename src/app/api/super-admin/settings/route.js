import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

const DEFAULTS = {
  app: {
    name:        "RMS Platform",
    logoUrl:     "",
    faviconUrl:  "",
    supportEmail:"support@rms.com",
    contactPhone:"",
    address:     "",
  },
  email: {
    smtpHost:    "",
    smtpPort:    587,
    smtpUser:    "",
    smtpPassword:"",
    fromName:    "RMS Platform",
    fromEmail:   "",
    secure:      false,
  },
  language: {
    defaultLanguage: "en",
    timezone:        "UTC",
    dateFormat:      "MM/DD/YYYY",
    timeFormat:      "12h",
  },
  payment: {
    stripePublicKey:  "",
    stripeSecretKey:  "",
    webhookSecret:    "",
    currency:         "USD",
    taxPercent:       0,
    trialDays:        14,
  },
  theme: {
    primaryColor: "#10b981",
    accentColor:  "#f43f5e",
    darkMode:     true,
  },
  notifications: {
    newRestaurantAlert: true,
    paymentFailAlert:   true,
    weeklyReport:       false,
    systemAlerts:       true,
    pushEnabled:        false,
    pushVapidPublicKey: "",
    pushVapidPrivateKey:"",
  },
  currencies: {
    default:   "USD",
    supported: ["USD", "EUR", "GBP", "INR", "AUD", "CAD"],
  },

  /* ── NEW SECTIONS ── */
  sms: {
    provider:   "twilio",   // "twilio" | "fast2sms"
    apiKey:     "",
    authToken:  "",
    senderId:   "",
    enabled:    false,
  },
  security: {
    minPasswordLength:      8,
    requireSpecialChars:    true,
    requireNumbers:         true,
    loginAttemptLimit:      5,
    blockDurationMinutes:   30,
    enable2FA:              false,
    sessionTimeoutMinutes:  60,
    ipWhitelist:            "",   // comma-separated
  },
  backup: {
    autoBackup:       false,
    backupSchedule:   "daily",   // "daily" | "weekly"
    retentionDays:    30,
    lastBackupAt:     null,
  },
  integrations: {
    googleAnalyticsId: "",
    metaPixelId:       "",
    webhookUrl:        "",
    webhookSecret:     "",
    razorpayKeyId:     "",
    razorpayKeySecret: "",
  },
  advanced: {
    maintenanceMode:  false,
    debugMode:        false,
    invoicePrefix:    "INV-",
    autoBilling:      true,
    featureMenuQR:    true,
    featureOnlineOrder: true,
    featureReservations: true,
    featureInventory: true,
  },
};
const SECRET_MASK = "********";
const SECRET_FIELDS = {
  email: ["smtpPassword"],
  payment: ["stripeSecretKey", "webhookSecret"],
  notifications: ["pushVapidPrivateKey"],
  sms: ["apiKey", "authToken"],
  integrations: ["webhookSecret", "razorpayKeySecret"],
};

function sanitizeSectionData(section, incoming = {}) {
  const base = { ...DEFAULTS[section] };
  const clean = {};

  for (const key of Object.keys(base)) {
    if (!(key in incoming)) continue;
    const value = incoming[key];
    const def = base[key];

    if (Array.isArray(def)) {
      clean[key] = Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : def;
      continue;
    }

    if (typeof def === "boolean") {
      clean[key] = Boolean(value);
      continue;
    }

    if (typeof def === "number") {
      const n = Number(value);
      clean[key] = Number.isFinite(n) ? n : def;
      continue;
    }

    if (def === null) {
      clean[key] = value ? new Date(value) : null;
      if (clean[key] && Number.isNaN(clean[key].getTime())) clean[key] = null;
      continue;
    }

    clean[key] = value == null ? "" : String(value).trim();
  }

  // Section-specific guards
  if (section === "payment") {
    clean.taxPercent = Math.min(100, Math.max(0, Number(clean.taxPercent ?? base.taxPercent)));
    clean.trialDays  = Math.min(90, Math.max(0, Number(clean.trialDays ?? base.trialDays)));
  }
  if (section === "email") {
    const port = Number(clean.smtpPort ?? base.smtpPort);
    clean.smtpPort = Number.isFinite(port) && port >= 1 && port <= 65535 ? port : base.smtpPort;
  }
  if (section === "backup") {
    clean.retentionDays = Math.min(365, Math.max(1, Number(clean.retentionDays ?? base.retentionDays)));
    if (!["daily", "weekly"].includes(clean.backupSchedule)) clean.backupSchedule = base.backupSchedule;
  }
  if (section === "advanced") {
    clean.invoicePrefix = (clean.invoicePrefix || base.invoicePrefix).slice(0, 20);
  }

  return { ...base, ...clean };
}

/* ── GET /api/super-admin/settings ── */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  try {
    const client = await clientPromise;
    const db     = client.db();
    const doc    = await db.collection("settings").findOne({ _id: "platform" });

    const settings = {};
    for (const section of Object.keys(DEFAULTS)) {
      const merged = { ...DEFAULTS[section], ...(doc?.[section] ?? {}) };
      for (const key of SECRET_FIELDS[section] ?? []) {
        if (merged[key]) merged[key] = SECRET_MASK;
      }
      settings[section] = merged;
    }
    return Response.json({ success: true, settings });
  } catch (err) {
    console.error("GET settings error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── PATCH /api/super-admin/settings
   Body: { section: string, data: object }
── */
export async function PATCH(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { section, data } = body;
  if (!section || !Object.keys(DEFAULTS).includes(section)) {
    return Response.json(
      { success: false, error: `Invalid section. Must be one of: ${Object.keys(DEFAULTS).join(", ")}.` },
      { status: 400 }
    );
  }
  if (!data || typeof data !== "object") {
    return Response.json({ success: false, error: "data must be an object." }, { status: 400 });
  }

  const clean = sanitizeSectionData(section, data);

  try {
    const client = await clientPromise;
    const db     = client.db();
    const existing = await db.collection("settings").findOne({ _id: "platform" }, { projection: { [section]: 1 } });

    // Keep already-saved secrets unless caller provides a new value.
    const mergedForSave = { ...clean };
    for (const key of SECRET_FIELDS[section] ?? []) {
      const incoming = data[key];
      if (incoming == null || incoming === "" || incoming === SECRET_MASK) {
        mergedForSave[key] = existing?.[section]?.[key] ?? "";
      }
    }

    await db.collection("settings").updateOne(
      { _id: "platform" },
      { $set: { [section]: mergedForSave, updatedAt: new Date() } },
      { upsert: true }
    );
    return Response.json({ success: true, section });
  } catch (err) {
    console.error("PATCH settings error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
