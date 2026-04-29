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
      settings[section] = { ...DEFAULTS[section], ...(doc?.[section] ?? {}) };
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

  /* Strip unknown keys */
  const allowed = Object.keys(DEFAULTS[section]);
  const clean   = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));

  try {
    const client = await clientPromise;
    const db     = client.db();
    await db.collection("settings").updateOne(
      { _id: "platform" },
      { $set: { [section]: clean, updatedAt: new Date() } },
      { upsert: true }
    );
    return Response.json({ success: true, section, saved: clean });
  } catch (err) {
    console.error("PATCH settings error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
