import { emailError, optionalIndianPhoneError } from "@/lib/formValidation";
import { optionalLinkError } from "@/lib/landingValidation";

function trim(value) {
  return String(value ?? "").trim();
}

function optionalHttpsUrl(value, label) {
  const v = trim(value);
  if (!v) return null;
  try {
    const u = new URL(v);
    if (!["http:", "https:"].includes(u.protocol)) {
      return `${label} must use http:// or https://`;
    }
  } catch {
    return `Enter a valid ${label}.`;
  }
  return null;
}

function errorsToResult(errors) {
  const first = Object.values(errors).find(Boolean);
  return { valid: !first, errors, message: first ?? null };
}

export function validatePlatformAppSettings(data) {
  const errors = {};
  const name = trim(data?.name);
  if (!name) errors.name = "Platform name is required.";
  else if (name.length < 2) errors.name = "Platform name must be at least 2 characters.";
  else if (name.length > 80) errors.name = "Platform name must be 80 characters or less.";

  const legal = trim(data?.legalName);
  if (legal && legal.length > 120) {
    errors.legalName = "Legal name must be 120 characters or less.";
  }

  errors.logoUrl = optionalHttpsUrl(data?.logoUrl, "Logo URL") ?? "";
  errors.faviconUrl = optionalHttpsUrl(data?.faviconUrl, "Favicon URL") ?? "";

  errors.supportEmail = emailError(data?.supportEmail) ?? "";

  errors.contactPhone = optionalIndianPhoneError(data?.contactPhone) ?? "";

  const address = trim(data?.address);
  if (address && address.length > 200) {
    errors.address = "Address must be 200 characters or less.";
  }

  return errorsToResult(errors);
}

export function validatePlatformEmailSettings(data) {
  const errors = {};
  const host = trim(data?.smtpHost);
  const user = trim(data?.smtpUser);
  const hasSmtp = Boolean(host || user);

  if (hasSmtp) {
    if (!host) errors.smtpHost = "SMTP host is required when configuring email.";
    if (!user) errors.smtpUser = "SMTP username is required when configuring email.";
  }

  const port = Number(data?.smtpPort);
  if (data?.smtpPort != null && data.smtpPort !== "") {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.smtpPort = "SMTP port must be between 1 and 65535.";
    }
  }

  const fromEmail = trim(data?.fromEmail);
  if (fromEmail) {
    errors.fromEmail = emailError(fromEmail) ?? "";
  } else if (hasSmtp) {
    errors.fromEmail = "From email is required when SMTP is configured.";
  }

  const fromName = trim(data?.fromName);
  if (fromName && fromName.length > 80) {
    errors.fromName = "From name must be 80 characters or less.";
  }

  return errorsToResult(errors);
}

export function validatePlatformPaymentSettings(data) {
  const errors = {};
  const currency = trim(data?.currency);
  if (currency && !/^[A-Za-z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a 3-letter code (e.g. INR).";
  }

  const tax = Number(data?.taxPercent);
  if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
    errors.taxPercent = "Tax rate must be between 0 and 100.";
  }

  const trial = Number(data?.trialDays);
  if (!Number.isInteger(trial) || trial < 0 || trial > 90) {
    errors.trialDays = "Trial period must be a whole number from 0 to 90.";
  }

  const gst = trim(data?.gstNumber);
  if (gst && gst.length > 20) {
    errors.gstNumber = "GSTIN must be 20 characters or less.";
  }

  return errorsToResult(errors);
}

export function validatePlatformSecuritySettings(data) {
  const errors = {};
  const minLen = Number(data?.minPasswordLength);
  if (!Number.isInteger(minLen) || minLen < 6 || minLen > 32) {
    errors.minPasswordLength = "Minimum password length must be between 6 and 32.";
  }

  const attempts = Number(data?.loginAttemptLimit);
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 20) {
    errors.loginAttemptLimit = "Login attempt limit must be between 1 and 20.";
  }

  const block = Number(data?.blockDurationMinutes);
  if (!Number.isInteger(block) || block < 1 || block > 1440) {
    errors.blockDurationMinutes = "Block duration must be between 1 and 1440 minutes.";
  }

  const session = Number(data?.sessionTimeoutMinutes);
  if (!Number.isInteger(session) || session < 0 || session > 10080) {
    errors.sessionTimeoutMinutes = "Session timeout must be between 0 and 10080 minutes.";
  }

  return errorsToResult(errors);
}

export function validatePlatformSmsSettings(data) {
  const errors = {};
  if (!data?.enabled) return errorsToResult(errors);

  if (!trim(data?.apiKey)) errors.apiKey = "API key is required when SMS is enabled.";
  if (!trim(data?.senderId)) errors.senderId = "Sender ID is required when SMS is enabled.";

  return errorsToResult(errors);
}

export function validatePlatformThemeSettings(data) {
  const errors = {};
  const hex = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;
  const primary = trim(data?.primaryColor);
  const accent = trim(data?.accentColor);
  if (primary && !hex.test(primary)) errors.primaryColor = "Enter a valid hex color (e.g. #10b981).";
  if (accent && !hex.test(accent)) errors.accentColor = "Enter a valid hex color (e.g. #f43f5e).";
  return errorsToResult(errors);
}

export function validatePlatformIntegrationsSettings(data) {
  const errors = {};
  errors.webhookUrl = optionalLinkError(data?.webhookUrl, "Webhook URL") ?? "";
  const ga = trim(data?.googleAnalyticsId);
  if (ga && ga.length > 40) errors.googleAnalyticsId = "Analytics ID is too long.";
  return errorsToResult(errors);
}

/** Client + server validation by settings tab id */
export function validatePlatformSettingsSection(section, data) {
  switch (section) {
    case "app":
      return validatePlatformAppSettings(data);
    case "email":
      return validatePlatformEmailSettings(data);
    case "payment":
      return validatePlatformPaymentSettings(data);
    case "security":
      return validatePlatformSecuritySettings(data);
    case "sms":
      return validatePlatformSmsSettings(data);
    case "theme":
      return validatePlatformThemeSettings(data);
    case "integrations":
      return validatePlatformIntegrationsSettings(data);
    default:
      return { valid: true, errors: {}, message: null };
  }
}

export function validatePlatformSettingsSectionServer(section, data) {
  const result = validatePlatformSettingsSection(section, data);
  return result.valid ? null : result.message;
}
