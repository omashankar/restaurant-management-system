import { normalizeAccessControl } from "@/config/accessControlConfig";
import {
  EMPTY_SETTINGS,
  normalizeDateFormat,
  normalizeTimeFormat,
} from "@/config/settingsConfig";
import { resolveRestaurantAdminTheme } from "@/lib/restaurantAdminThemeRuntime";
import { sanitizeOpeningHoursSchedule } from "@/lib/reservationUtils";
import { validateRestaurantSettingsPatch } from "@/lib/restaurantSettingsValidation";
import { deleteUploadedImageIfReplaced } from "@/lib/uploadImage";
import { withTenant } from "@/lib/tenantDb";

const SECRET_MASK = "********";
const PAYMENT_METHOD_KEYS = [
  "cod",
  "cashCounter",
  "upi",
  "card",
  "netBanking",
  "wallet",
  "payLater",
  "bankTransfer",
];

function sanitizeEmailSection(incoming = {}) {
  const base = { ...EMPTY_SETTINGS.email };
  const merged = { ...base, ...incoming };
  const port = Number(merged.smtpPort);
  merged.smtpPort =
    Number.isFinite(port) && port >= 1 && port <= 65535 ? port : base.smtpPort;
  merged.enabled = Boolean(merged.enabled);
  merged.secure = Boolean(merged.secure);
  for (const key of ["smtpHost", "smtpUser", "smtpPassword", "fromName", "fromEmail"]) {
    merged[key] = merged[key] == null ? "" : String(merged[key]).trim();
  }
  return merged;
}

/** Keep DB password when the client sends empty or the mask token. */
function mergeEmailForSave(incoming, existingEmail) {
  const clean = sanitizeEmailSection({ ...EMPTY_SETTINGS.email, ...incoming });
  const raw = incoming?.smtpPassword;
  if (raw == null || raw === "" || raw === SECRET_MASK) {
    clean.smtpPassword = existingEmail?.smtpPassword ?? "";
  }
  return clean;
}

function sanitizePaymentMethods(incoming = {}) {
  const base = { ...EMPTY_SETTINGS.paymentMethods };
  const out = { ...base, ...(incoming || {}) };
  for (const key of PAYMENT_METHOD_KEYS) {
    out[key] = Boolean(out[key]);
  }
  const fallbackDefault = PAYMENT_METHOD_KEYS.find((k) => out[k]) ?? "cod";
  out.defaultMethod = PAYMENT_METHOD_KEYS.includes(String(out.defaultMethod))
    ? String(out.defaultMethod)
    : fallbackDefault;
  if (!out[out.defaultMethod]) out.defaultMethod = fallbackDefault;
  return out;
}

function sanitizeThemeSection(incoming = {}) {
  return resolveRestaurantAdminTheme({ ...EMPTY_SETTINGS.theme, ...incoming });
}

function sanitizeNotificationsSection(incoming = {}) {
  const base = { ...EMPTY_SETTINGS.notifications };
  const out = { ...base, ...(incoming || {}) };
  for (const key of Object.keys(base)) {
    out[key] = Boolean(out[key]);
  }
  return out;
}

function sanitizeOpeningHoursSection(incoming = []) {
  return sanitizeOpeningHoursSchedule(incoming);
}

function sanitizeAccessControlSection(incoming = {}) {
  return normalizeAccessControl(incoming);
}

function sanitizeGeneralSection(incoming = {}, existing = {}) {
  const merged = {
    ...EMPTY_SETTINGS.general,
    ...(existing ?? {}),
    ...(incoming ?? {}),
  };
  merged.restaurantName = String(merged.restaurantName ?? "").trim();
  merged.logoUrl = String(merged.logoUrl ?? "").trim();
  merged.currency = String(merged.currency ?? EMPTY_SETTINGS.general.currency).trim()
    || EMPTY_SETTINGS.general.currency;
  merged.timezone = String(merged.timezone ?? EMPTY_SETTINGS.general.timezone).trim()
    || EMPTY_SETTINGS.general.timezone;
  merged.language = "English";
  merged.dateFormat = normalizeDateFormat(merged.dateFormat);
  merged.timeFormat = normalizeTimeFormat(merged.timeFormat);
  return merged;
}

/* ── GET /api/settings ── */
export const GET = withTenant(
  ["admin", "manager", "waiter", "chef"],
  async ({ db, restaurantId, payload }) => {
    const doc = await db
      .collection("restaurant_settings")
      .findOne({ restaurantId });

    // Merge stored values over empty defaults so shape is always complete
    const settings = {};
    for (const section of Object.keys(EMPTY_SETTINGS)) {
      const def = EMPTY_SETTINGS[section];
      const stored = doc?.[section] ?? null;

      if (Array.isArray(def)) {
        settings[section] =
          section === "openingHours"
            ? sanitizeOpeningHoursSection(Array.isArray(stored) ? stored : def)
            : Array.isArray(stored)
              ? stored
              : def;
      } else {
        settings[section] = { ...def, ...(stored ?? {}) };
      }
    }

    // Tenant SMTP: only restaurant admins can read stored values; password always masked.
    if (payload.role !== "admin") {
      settings.email = { ...EMPTY_SETTINGS.email };
    } else if (settings.email?.smtpPassword) {
      settings.email = { ...settings.email, smtpPassword: SECRET_MASK };
    }

    // Restaurant slug (for multi-restaurant customer URL)
    const restaurantDoc = restaurantId
      ? await db.collection("restaurants").findOne(
          { _id: restaurantId },
          { projection: { slug: 1, name: 1, logoUrl: 1 } }
        )
      : null;
    const restaurantSlug = restaurantDoc?.slug ?? null;
    if (settings.general) {
      settings.general = sanitizeGeneralSection(settings.general);
      settings.general.logoUrl =
        restaurantDoc?.logoUrl?.trim() || settings.general.logoUrl?.trim() || "";
    }

    return Response.json({ success: true, settings, restaurantSlug });
  }
);

/* ── PATCH /api/settings ── */
export const PATCH = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();

  const existing = await db
    .collection("restaurant_settings")
    .findOne({ restaurantId });

  // Accept either a full settings object or a single { section, data } patch
  let updateFields = {};

  if (body.section && body.data && typeof body.data === "object") {
    const allowed = Object.keys(EMPTY_SETTINGS);
    if (!allowed.includes(body.section)) {
      return Response.json({ success: false, error: "Invalid section." }, { status: 400 });
    }
    if (body.section === "email") {
      updateFields.email = mergeEmailForSave(body.data, existing?.email);
    } else if (body.section === "paymentMethods") {
      updateFields.paymentMethods = sanitizePaymentMethods(body.data);
    } else if (body.section === "theme") {
      updateFields.theme = sanitizeThemeSection(body.data);
    } else if (body.section === "general") {
      updateFields.general = sanitizeGeneralSection(body.data, existing?.general);
    } else if (body.section === "notifications") {
      updateFields.notifications = sanitizeNotificationsSection(body.data);
    } else if (body.section === "openingHours") {
      updateFields.openingHours = sanitizeOpeningHoursSection(body.data);
    } else if (body.section === "accessControl") {
      updateFields.accessControl = sanitizeAccessControlSection(body.data);
    } else {
      updateFields[body.section] = body.data;
    }
  } else {
    for (const section of Object.keys(EMPTY_SETTINGS)) {
      if (!body[section]) continue;
      if (section === "email") {
        updateFields.email = mergeEmailForSave(body.email, existing?.email);
      } else if (section === "paymentMethods") {
        updateFields.paymentMethods = sanitizePaymentMethods(body.paymentMethods);
      } else if (section === "theme") {
        updateFields.theme = sanitizeThemeSection(body[section]);
      } else if (section === "general") {
        updateFields.general = sanitizeGeneralSection(body[section], existing?.general);
      } else if (section === "notifications") {
        updateFields.notifications = sanitizeNotificationsSection(body[section]);
      } else if (section === "openingHours") {
        updateFields.openingHours = sanitizeOpeningHoursSection(body[section]);
      } else if (section === "accessControl") {
        updateFields.accessControl = sanitizeAccessControlSection(body[section]);
      } else {
        updateFields[section] = body[section];
      }
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return Response.json({ success: false, error: "No valid data provided." }, { status: 400 });
  }

  const mergedForValidation = { ...EMPTY_SETTINGS };
  for (const key of Object.keys(EMPTY_SETTINGS)) {
    if (updateFields[key] != null) {
      mergedForValidation[key] = updateFields[key];
    } else if (existing?.[key] != null) {
      mergedForValidation[key] = existing[key];
    }
  }
  const sectionsToValidate = Object.keys(updateFields).filter(
    (key) => key !== "updatedAt" && Object.prototype.hasOwnProperty.call(EMPTY_SETTINGS, key)
  );
  const validation = validateRestaurantSettingsPatch(mergedForValidation, sectionsToValidate);
  if (!validation.valid) {
    return Response.json(
      {
        success: false,
        error: validation.message ?? "Validation failed.",
        tabs: validation.tabs,
      },
      { status: 422 }
    );
  }

  updateFields.updatedAt = new Date();

  await db.collection("restaurant_settings").updateOne(
    { restaurantId },
    { $set: updateFields },
    { upsert: true }
  );

  if (updateFields.general && restaurantId) {
    const restaurantDoc = await db.collection("restaurants").findOne(
      { _id: restaurantId },
      { projection: { logoUrl: 1 } }
    );
    const restaurantPatch = { updatedAt: new Date() };
    const name = updateFields.general.restaurantName?.trim();
    if (name) restaurantPatch.name = name;
    if ("logoUrl" in updateFields.general) {
      const url = String(updateFields.general.logoUrl ?? "").trim();
      restaurantPatch.logoUrl = url || null;
    }
    if (Object.keys(restaurantPatch).length > 1) {
      await db.collection("restaurants").updateOne(
        { _id: restaurantId },
        { $set: restaurantPatch }
      );
    }
    if ("logoUrl" in updateFields.general) {
      const prevLogo =
        restaurantDoc?.logoUrl?.trim() ||
        existing?.general?.logoUrl?.trim() ||
        "";
      const nextLogo = String(updateFields.general.logoUrl ?? "").trim();
      await deleteUploadedImageIfReplaced(prevLogo, nextLogo);
    }
  }

  return Response.json({ success: true });
});
