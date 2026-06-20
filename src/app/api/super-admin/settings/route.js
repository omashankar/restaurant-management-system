import { BHOJDESK_BRAND, BHOJDESK_LOGOS } from "@/config/bhojdeskBrand";
import { writeAuditLog } from "@/lib/auditLog";
import { normalizePlatformLocaleSection } from "@/config/platformLocaleConfig";
import { invalidatePlatformSettingsCache, PLATFORM_DEFAULTS } from "@/lib/platformSettings";
import { validatePlatformSettingsSectionServer } from "@/lib/platformSettingsValidation";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

const DEFAULTS = {
  ...PLATFORM_DEFAULTS,
  app: {
    ...PLATFORM_DEFAULTS.app,
    name: BHOJDESK_BRAND.fullName,
    legalName: BHOJDESK_BRAND.name,
    logoUrl: BHOJDESK_LOGOS.icon,
    faviconUrl: BHOJDESK_LOGOS.icon,
    supportEmail: BHOJDESK_BRAND.supportEmail,
  },
  email: {
    ...PLATFORM_DEFAULTS.email,
    smtpHost:    "",
    smtpPort:    587,
    smtpUser:    "",
    smtpPassword:"",
    fromName:    BHOJDESK_BRAND.name,
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
    currency:         "INR",
    taxPercent:       0,
    gstNumber:        "",
    gstHsnSac:        "",
    gstSupplyType:    "intra_state",
    gstInclusivePricing: true,
    gstPlaceOfSupply: "",
    trialDays:        14,
    gateways: {},
  },
  theme: {
    primaryColor: "#a3e635",
    accentColor:  "#10b981",
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
    default:   "INR",
    supported: ["INR", "USD", "EUR", "GBP", "AUD", "CAD"],
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
    minPasswordLength:      6,
    requireSpecialChars:    false,
    requireNumbers:         false,
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
const GATEWAY_SECRET_FIELDS = ["secretKey", "webhookSecret"];

function maskGatewaySecrets(gateways = {}) {
  const masked = {};
  for (const [gwId, gw] of Object.entries(gateways)) {
    if (!gw || typeof gw !== "object") continue;
    masked[gwId] = { ...gw };
    for (const field of GATEWAY_SECRET_FIELDS) {
      if (masked[gwId][field]) masked[gwId][field] = SECRET_MASK;
    }
  }
  return masked;
}

function mergeGatewaySecrets(incoming = {}, existing = {}) {
  const merged = { ...existing };
  for (const [gwId, gwData] of Object.entries(incoming)) {
    if (!gwData || typeof gwData !== "object") continue;
    const prev = existing[gwId] ?? {};
    const next = { ...prev, ...gwData };
    for (const field of GATEWAY_SECRET_FIELDS) {
      const val = gwData[field];
      if (val == null || val === "" || val === SECRET_MASK) {
        next[field] = prev[field] ?? "";
      }
    }
    merged[gwId] = next;
  }
  return merged;
}

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
    clean.gstInclusivePricing = Boolean(clean.gstInclusivePricing);
    if (!["intra_state", "inter_state"].includes(clean.gstSupplyType)) {
      clean.gstSupplyType = base.gstSupplyType;
    }
    clean.gstHsnSac = String(clean.gstHsnSac ?? "").trim().slice(0, 20);
    clean.gstPlaceOfSupply = String(clean.gstPlaceOfSupply ?? "").trim().slice(0, 80);
    // Preserve gateways object as-is (handled separately)
    if (incoming.gateways && typeof incoming.gateways === "object") {
      clean.gateways = incoming.gateways;
    }
  }
  if (section === "email") {
    const port = Number(clean.smtpPort ?? base.smtpPort);
    clean.smtpPort = Number.isFinite(port) && port >= 1 && port <= 65535 ? port : base.smtpPort;
  }
  if (section === "backup") {
    clean.retentionDays = Math.min(365, Math.max(1, Number(clean.retentionDays ?? base.retentionDays)));
    if (!["daily", "weekly"].includes(clean.backupSchedule)) clean.backupSchedule = base.backupSchedule;
  }
  if (section === "language") {
    Object.assign(clean, normalizePlatformLocaleSection(clean));
  }
  if (section === "currencies") {
    const def = String(clean.default ?? base.default).toUpperCase().slice(0, 3);
    let supported = Array.isArray(clean.supported)
      ? [...new Set(clean.supported.map((c) => String(c).toUpperCase().slice(0, 3)).filter((c) => /^[A-Z]{3}$/.test(c)))]
      : [...base.supported];
    if (!supported.length) supported = [def || base.default];
    if (def && !supported.includes(def)) supported.unshift(def);
    clean.default = def || base.default;
    clean.supported = supported;
  }
  if (section === "advanced") {
    clean.invoicePrefix = (clean.invoicePrefix || base.invoicePrefix).slice(0, 20);
  }

  return { ...base, ...clean };
}

function maskSectionForClient(section, merged) {
  const out = { ...merged };
  for (const key of SECRET_FIELDS[section] ?? []) {
    if (out[key]) out[key] = SECRET_MASK;
  }
  if (section === "payment" && out.gateways) {
    out.gateways = maskGatewaySecrets(out.gateways);
  }
  return out;
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
      settings[section] = maskSectionForClient(section, merged);
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
  const sa = superAdminOnly(request);
  if (!sa) {
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

  const validationError = validatePlatformSettingsSectionServer(section, clean);
  if (validationError) {
    return Response.json({ success: false, error: validationError }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();
    const projection =
      section === "payment"
        ? { payment: 1, currencies: 1 }
        : { [section]: 1 };
    const existing = await db.collection("settings").findOne({ _id: "platform" }, { projection });

    // Keep already-saved secrets unless caller provides a new value.
    const mergedForSave = { ...clean };
    for (const key of SECRET_FIELDS[section] ?? []) {
      const incoming = data[key];
      if (incoming == null || incoming === "" || incoming === SECRET_MASK) {
        mergedForSave[key] = existing?.[section]?.[key] ?? "";
      }
    }
    if (section === "payment" && data.gateways) {
      mergedForSave.gateways = mergeGatewaySecrets(
        data.gateways,
        existing?.payment?.gateways ?? {},
      );
    }

    const setFields = { [section]: mergedForSave, updatedAt: new Date() };

    /* Keep billing currency aligned with Currencies tab default */
    if (section === "currencies" && mergedForSave.default) {
      setFields["payment.currency"] = mergedForSave.default;
    }
    if (section === "payment" && mergedForSave.currency) {
      const code = String(mergedForSave.currency).toUpperCase();
      const existingCurrencies = existing?.currencies ?? DEFAULTS.currencies;
      let supported = Array.isArray(existingCurrencies.supported)
        ? [...existingCurrencies.supported]
        : [...DEFAULTS.currencies.supported];
      if (!supported.map((c) => String(c).toUpperCase()).includes(code)) {
        supported.unshift(code);
      }
      setFields["currencies.default"] = code;
      setFields["currencies.supported"] = supported;
    }

    await db.collection("settings").updateOne(
      { _id: "platform" },
      { $set: setFields },
      { upsert: true }
    );

    invalidatePlatformSettingsCache();

    await writeAuditLog({
      action: "settings.updated",
      category: "settings",
      actorId: sa.id,
      targetName: section,
      meta: { section },
      ip: getClientIp(request),
    });

    return Response.json({
      success: true,
      section,
      sectionData: maskSectionForClient(section, mergedForSave),
    });
  } catch (err) {
    console.error("PATCH settings error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
