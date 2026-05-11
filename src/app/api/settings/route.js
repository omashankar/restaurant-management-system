import { EMPTY_SETTINGS } from "@/config/settingsConfig";
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
        settings[section] = Array.isArray(stored) ? stored : def;
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

    return Response.json({ success: true, settings });
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
      } else {
        updateFields[section] = body[section];
      }
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return Response.json({ success: false, error: "No valid data provided." }, { status: 400 });
  }

  updateFields.updatedAt = new Date();

  await db.collection("restaurant_settings").updateOne(
    { restaurantId },
    { $set: updateFields },
    { upsert: true }
  );

  return Response.json({ success: true });
});
