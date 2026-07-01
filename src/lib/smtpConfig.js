/** Mask token returned by settings APIs for stored SMTP passwords. */
export const SMTP_SECRET_MASK = "********";

/** True when the client sent a placeholder instead of a real SMTP password. */
export function isSmtpPasswordMask(value) {
  const s = String(value ?? "");
  if (!s || s === SMTP_SECRET_MASK) return true;
  if (/^[•*\u2022.]{4,}$/.test(s)) return true;
  return false;
}

/** Brevo-specific checks before attempting SMTP auth. */
export function detectBrevoSmtpIssues(smtp) {
  const host = normalizeSmtpHost(smtp?.smtpHost);
  if (!host.includes("brevo.com")) return null;

  const pass = String(smtp?.smtpPassword ?? "");
  if (/^xkeysib-/i.test(pass)) {
    return "You pasted a Brevo API key. In Brevo go to SMTP & API → SMTP keys, create a key (starts with xsmtpsib-) and paste that as SMTP Password.";
  }

  return null;
}

/** Trim host and fix common Brevo typos (e.g. serversmtp-relay → smtp-relay). */
export function normalizeSmtpHost(host) {
  let h = String(host ?? "").trim().toLowerCase();
  if (!h) return "";
  h = h.replace(/^serversmtp-relay\./, "smtp-relay.");
  h = h.replace(/^server\.smtp-relay\./, "smtp-relay.");
  return h;
}

/** Port 465 = implicit TLS; 587/25 = STARTTLS (secure must be false). */
export function normalizeSmtpSecure(port, secure) {
  const p = Number(port);
  if (p === 465) return true;
  if (p === 587 || p === 25 || p === 2525) return false;
  return Boolean(secure);
}

export function formatSmtpError(err, host = "") {
  const raw = String(err?.message ?? err ?? "").trim();
  if (/ENOTFOUND/i.test(raw)) {
    const h = host || raw.match(/ENOTFOUND\s+(\S+)/i)?.[1] || "SMTP host";
    return `Cannot reach mail server "${h}". Check SMTP Host spelling — for Brevo use smtp-relay.brevo.com (port 587, SSL off).`;
  }
  if (/not yet activated|smtp account is not/i.test(raw)) {
    return "Your Brevo SMTP account is not activated yet. Log in at brevo.com → complete account verification, then email contact@brevo.com to request SMTP activation (new accounts often need this).";
  }
  if (/EAUTH|authentication|invalid login|535/i.test(raw)) {
    const hostNorm = normalizeSmtpHost(host);
    if (hostNorm.includes("brevo.com")) {
      return [
        "Brevo rejected SMTP login (535). Check:",
        "1) SMTP Username = Brevo Login (e.g. 123456@smtp-brevo.com), not From Email.",
        "2) SMTP Password = SMTP key from Brevo → SMTP & API (not API key xkeysib- or login password).",
        "3) Sender address must be verified in Brevo if different from login email.",
      ].join(" ");
    }
    return "SMTP login failed. Check username and password (use your provider SMTP key, not your login password).";
  }
  if (/wrong version number|tls_validate_record_header/i.test(raw)) {
    return "SSL/TLS mismatch: port 587 needs “Use SSL/TLS” OFF (STARTTLS). Use SSL ON only with port 465.";
  }
  if (/self signed|certificate/i.test(raw)) {
    return "SMTP TLS certificate error. Try toggling SSL/TLS or use port 587 with SSL off.";
  }
  return raw || "Failed to send email. Check SMTP settings.";
}

/**
 * Merge form SMTP snapshot with stored credentials (password mask fallback).
 * @returns {{ ok: true, effective: object } | { ok: false, status: number, error: string }}
 */
export function buildEffectiveSmtpConfig(smtpInput, storedEmail = {}) {
  const hostRaw = String(smtpInput?.smtpHost ?? "").trim();
  const user = String(smtpInput?.smtpUser ?? "").trim();
  if (!hostRaw || !user) {
    return { ok: false, status: 400, error: "SMTP Host and Username are required." };
  }

  const smtpHost = normalizeSmtpHost(hostRaw);
  if (!smtpHost) {
    return { ok: false, status: 400, error: "SMTP Host is required." };
  }

  const port = Number(smtpInput?.smtpPort ?? 587);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return { ok: false, status: 400, error: "Invalid SMTP port." };
  }

  let password = String(smtpInput?.smtpPassword ?? "");
  if (isSmtpPasswordMask(password)) {
    password = String(storedEmail?.smtpPassword ?? "");
  }
  if (!password.trim()) {
    return {
      ok: false,
      status: 400,
      error: "SMTP password is missing. Enter the password and click Save, then send the test again.",
    };
  }

  const effective = {
    ...smtpInput,
    smtpHost,
    smtpUser: user,
    smtpPort: port,
    smtpPassword: password,
    secure: normalizeSmtpSecure(port, smtpInput?.secure),
  };

  const brevoIssue = detectBrevoSmtpIssues(effective);
  if (brevoIssue) {
    return { ok: false, status: 400, error: brevoIssue };
  }

  return {
    ok: true,
    effective,
  };
}

/** Normalize stored SMTP fields before transport / API responses. */
export function sanitizeSmtpSettings(incoming = {}, base = {}) {
  const merged = { ...base, ...incoming };
  const port = Number(merged.smtpPort ?? base.smtpPort ?? 587);
  merged.smtpPort =
    Number.isFinite(port) && port >= 1 && port <= 65535 ? port : (base.smtpPort ?? 587);
  if ("enabled" in merged || "enabled" in base) {
    merged.enabled = Boolean(merged.enabled);
  }
  merged.secure = normalizeSmtpSecure(merged.smtpPort, merged.secure);
  for (const key of ["smtpHost", "smtpUser", "fromName", "fromEmail"]) {
    merged[key] = merged[key] == null ? "" : String(merged[key]).trim();
  }
  merged.smtpPassword = merged.smtpPassword == null ? "" : String(merged.smtpPassword);
  merged.smtpHost = normalizeSmtpHost(merged.smtpHost);
  return merged;
}

/** Apply mask fallback when saving SMTP password from client forms. */
export function mergeSmtpPasswordForSave(clean, incomingPassword, storedPassword = "") {
  if (isSmtpPasswordMask(incomingPassword)) {
    return { ...clean, smtpPassword: storedPassword };
  }
  return clean;
}

/** Client-safe email section (password masked when present). */
export function maskSmtpSettingsForClient(email = {}) {
  const out = { ...email };
  if (out.smtpPassword) out.smtpPassword = SMTP_SECRET_MASK;
  return out;
}
