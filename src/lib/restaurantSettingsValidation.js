/**
 * Restaurant admin — settings, onboarding, WhatsApp, CMS, payments.
 */
import {
  DEFAULT_SIGNUP_PASSWORD_SECURITY,
  emailError,
  indianPhoneError,
  optionalIndianPhoneError,
  passwordMatchError,
  personNameError,
  platformPasswordError,
  positiveIntError,
  priceError,
} from "@/lib/formValidation";
import { optionalLinkError } from "@/lib/landingValidation";
import { extractIndianMobileDigits, isValidIndianMobile } from "@/lib/phoneUtils";
import {
  ACCESS_CONTROL_FEATURES,
  ACCESS_ROLES,
} from "@/config/accessControlConfig";
import { DATE_FORMAT_OPTIONS, EMPTY_SETTINGS, TIME_FORMAT_OPTIONS } from "@/config/settingsConfig";
import {
  getOperatingWindowMinutes,
  normalizeOpeningHoursRow,
} from "@/lib/reservationUtils";
import { SLOT_DURATION_MINUTES } from "@/lib/tableAvailability";
import { timeToMinutes } from "@/lib/tableAvailability";
import { normalizeHexColor } from "@/lib/superAdminThemeRuntime";

const OPENING_HOURS_WEEKDAYS = EMPTY_SETTINGS.openingHours.map((row) => row.day);
const NOTIFICATION_KEYS = Object.keys(EMPTY_SETTINGS.notifications);
const ACCESS_FEATURE_KEYS = new Set(ACCESS_CONTROL_FEATURES.map((f) => f.key));

const TIME_FORMAT_VALUES = TIME_FORMAT_OPTIONS.map((opt) => opt.value);

function trim(value) {
  return String(value ?? "").trim();
}

function errorsToResult(errors) {
  const message = Object.values(errors).find(Boolean) ?? null;
  return { valid: !message, errors, message };
}

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const UPI_RE = /^[\w.\-]{2,}@[\w.\-]{2,}$/i;

export function validateRestaurantGeneral(data) {
  const errors = {};
  const name = trim(data?.restaurantName);
  if (!name) errors.restaurantName = "Restaurant name is required.";
  else if (name.length < 2) errors.restaurantName = "Restaurant name must be at least 2 characters.";
  else if (name.length > 100) errors.restaurantName = "Restaurant name must be 100 characters or less.";

  const logoErr = optionalLinkError(data?.logoUrl, "Logo URL");
  if (logoErr) errors.logoUrl = logoErr;

  const currency = trim(data?.currency);
  if (!currency) errors.currency = "Currency is required.";

  const dateFormat = trim(data?.dateFormat);
  if (dateFormat && !DATE_FORMAT_OPTIONS.includes(dateFormat)) {
    errors.dateFormat = "Select a valid date format.";
  }

  const timeFormat = trim(data?.timeFormat);
  if (timeFormat && !TIME_FORMAT_VALUES.includes(timeFormat)) {
    errors.timeFormat = "Select a valid time format.";
  }

  return errorsToResult(errors);
}

export function validateRestaurantPos(data) {
  const errors = {};
  const tax = priceError(data?.taxPercentage, { required: true });
  if (tax) errors.taxPercentage = tax.replace("Price", "Tax percentage");
  const sc = priceError(data?.serviceCharge, { required: true });
  if (sc) errors.serviceCharge = sc.replace("Price", "Service charge");
  const taxN = Number(data?.taxPercentage);
  const scN = Number(data?.serviceCharge);
  if (!errors.taxPercentage && taxN > 100) errors.taxPercentage = "Tax cannot exceed 100%.";
  if (!errors.serviceCharge && scN > 100) errors.serviceCharge = "Service charge cannot exceed 100%.";
  return errorsToResult(errors);
}

export function validateRestaurantContact(data) {
  const errors = {};
  const phone = trim(data?.phoneNumber);
  if (phone) {
    errors.phoneNumber = optionalIndianPhoneError(phone) ?? "";
    if (!errors.phoneNumber && !isValidIndianMobile(extractIndianMobileDigits(phone))) {
      errors.phoneNumber = "Enter a valid 10-digit Indian mobile number.";
    }
  }
  const em = trim(data?.email);
  if (em) errors.email = emailError(em, { required: false }) ?? "";
  const maps = optionalLinkError(data?.googleMapsLink, "Google Maps link");
  if (maps) errors.googleMapsLink = maps;
  const addr = trim(data?.address);
  if (addr && addr.length > 300) errors.address = "Address must be 300 characters or less.";
  return errorsToResult(errors);
}

export function validateRestaurantEmail(data) {
  const errors = {};
  const host = trim(data?.smtpHost);
  const user = trim(data?.smtpUser);
  const enabled = Boolean(data?.enabled);
  const configuring = enabled || host || user;

  if (configuring) {
    if (!host) errors.smtpHost = "SMTP host is required when email is enabled.";
    if (!user) errors.smtpUser = "SMTP username is required when email is enabled.";
    const port = Number(data?.smtpPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.smtpPort = "SMTP port must be between 1 and 65535.";
    }
    const fromEmail = trim(data?.fromEmail);
    if (!fromEmail) errors.fromEmail = "From email is required when SMTP is enabled.";
    else errors.fromEmail = emailError(fromEmail) ?? "";
    const pwd = String(data?.smtpPassword ?? "");
    if (enabled && !pwd && pwd !== "********") {
      errors.smtpPassword = "SMTP password is required when enabling custom SMTP.";
    }
  }

  return errorsToResult(errors);
}

export function validatePaymentGatewaySave(gateways) {
  const errors = {};
  if (!gateways || typeof gateways !== "object") {
    return { valid: true, errors, message: null };
  }
  for (const [id, gw] of Object.entries(gateways)) {
    if (!gw?.enabled || id === "custom") continue;
    const key = String(gw.apiKey ?? "").trim();
    const secret = String(gw.secretKey ?? "").trim();
    const keyOk = key && !/^•{4,}/.test(key);
    const secretOk = secret && !/^•{4,}/.test(secret);
    if (!keyOk || !secretOk) {
      errors[`gateway_${id}`] =
        `${id}: enter full API Key and Secret Key (masked dots are not enough).`;
    }
  }
  return errorsToResult(errors);
}

export function validatePaymentBank(data) {
  const errors = {};
  const holder = trim(data?.accountHolderName);
  const bank = trim(data?.bankName);
  const acc = trim(data?.accountNumber);
  const ifsc = trim(data?.ifscCode).toUpperCase();
  const upi = trim(data?.upiId);
  const any = holder || bank || acc || ifsc || upi;

  if (any) {
    if (!holder) errors.accountHolderName = "Account holder name is required.";
    if (!bank) errors.bankName = "Bank name is required.";
    if (!acc || acc.length < 8) errors.accountNumber = "Enter a valid account number.";
    if (!ifsc) errors.ifscCode = "IFSC code is required.";
    else if (!IFSC_RE.test(ifsc)) errors.ifscCode = "Enter a valid IFSC code (e.g. HDFC0001234).";
    if (upi && !UPI_RE.test(upi) && !isValidIndianMobile(extractIndianMobileDigits(upi))) {
      errors.upiId = "Enter a valid UPI ID (e.g. name@bank).";
    }
  }
  return errorsToResult(errors);
}

export function validatePaymentTax(data) {
  const errors = {};
  const gst = trim(data?.gstNumber).toUpperCase();
  const pan = trim(data?.panNumber).toUpperCase();
  const pct = data?.gstPercentage;

  if (gst && !GSTIN_RE.test(gst)) {
    errors.gstNumber = "Enter a valid 15-character GSTIN.";
  }
  if (pan && !PAN_RE.test(pan)) {
    errors.panNumber = "Enter a valid PAN (e.g. AAAAA0000A).";
  }
  const taxErr = priceError(pct, { required: false });
  if (taxErr) errors.gstPercentage = taxErr.replace("Price", "GST percentage");
  else if (pct !== "" && pct != null && Number(pct) > 100) {
    errors.gstPercentage = "GST percentage cannot exceed 100.";
  }
  const prefix = trim(data?.invoicePrefix);
  if (prefix && !/^[A-Z0-9-]{2,10}$/i.test(prefix)) {
    errors.invoicePrefix = "Invoice prefix: 2–10 letters, numbers, or hyphens.";
  }
  return errorsToResult(errors);
}

export function validateRestaurantTheme(data) {
  const errors = {};
  const primary = trim(data?.primaryColor);
  const accent = trim(data?.accentColor);
  if (primary && !normalizeHexColor(primary)) {
    errors.primaryColor = "Enter a valid hex color (e.g. #10b981).";
  }
  if (accent && !normalizeHexColor(accent)) {
    errors.accentColor = "Enter a valid hex color (e.g. #34d399).";
  }
  return errorsToResult(errors);
}

export function validateRestaurantNotifications(data) {
  const errors = {};
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return errorsToResult({ notifications: "Invalid notification settings." });
  }

  for (const key of NOTIFICATION_KEYS) {
    if (key in data && typeof data[key] !== "boolean") {
      errors[key] = "Each notification option must be on or off.";
    }
  }

  for (const key of Object.keys(data)) {
    if (!NOTIFICATION_KEYS.includes(key)) {
      errors[key] = `Unknown notification option: ${key}.`;
    }
  }

  return errorsToResult(errors);
}

export function validateRestaurantOpeningHours(data) {
  const errors = {};
  if (!Array.isArray(data)) {
    return errorsToResult({ openingHours: "Opening hours must be a weekly schedule." });
  }
  if (data.length !== OPENING_HOURS_WEEKDAYS.length) {
    errors.openingHours = "Provide opening hours for all 7 days of the week.";
  }

  const seenDays = new Set();

  data.forEach((row, index) => {
    const day = trim(row?.day);
    const label = day || `Day ${index + 1}`;

    if (!day) {
      errors[`day_${index}`] = `${label}: weekday name is required.`;
      return;
    }
    if (!OPENING_HOURS_WEEKDAYS.includes(day)) {
      errors[`day_${index}`] = `${label}: select a valid weekday (Monday–Sunday).`;
      return;
    }
    if (seenDays.has(day.toLowerCase())) {
      errors[`day_${index}`] = `Duplicate schedule for ${day}.`;
      return;
    }
    seenDays.add(day.toLowerCase());

    if (typeof row.closed !== "boolean" && row.closed != null) {
      errors[`closed_${day}`] = `${day}: closed flag must be true or false.`;
    }

    if (row.closed) return;

    const normalized = normalizeOpeningHoursRow(row);
    if (!normalized) {
      errors[`hours_${day}`] = `${day}: enter valid open and close times (HH:MM).`;
      return;
    }

    const openMin = timeToMinutes(normalized.openTime);
    const closeMin = timeToMinutes(normalized.closeTime);
    if (!Number.isFinite(openMin) || openMin < 0 || openMin >= 24 * 60) {
      errors[`open_${day}`] = `${day}: open time must be between 00:00 and 23:59.`;
    }
    if (!Number.isFinite(closeMin) || closeMin < 0 || closeMin >= 24 * 60) {
      errors[`close_${day}`] = `${day}: close time must be between 00:00 and 23:59.`;
    }
    if (
      Number.isFinite(openMin) &&
      Number.isFinite(closeMin) &&
      openMin === closeMin
    ) {
      errors[`hours_${day}`] = `${day}: open and close times cannot be the same.`;
    }

    const windowMinutes = getOperatingWindowMinutes(
      normalized.openTime,
      normalized.closeTime,
    );
    if (windowMinutes > 0 && windowMinutes < SLOT_DURATION_MINUTES) {
      errors[`hours_${day}`] =
        `${day}: open at least ${SLOT_DURATION_MINUTES} minutes before close (each booking is ${SLOT_DURATION_MINUTES} min).`;
    }
  });

  for (const weekday of OPENING_HOURS_WEEKDAYS) {
    if (!seenDays.has(weekday.toLowerCase())) {
      errors[`missing_${weekday}`] = `Missing opening hours for ${weekday}.`;
    }
  }

  return errorsToResult(errors);
}

export function validateRestaurantAccessControl(data) {
  const errors = {};
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return errorsToResult({ accessControl: "Invalid access control settings." });
  }

  for (const feature of ACCESS_CONTROL_FEATURES) {
    const key = feature.key;
    const row = data[key];
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      errors[`feature_${key}`] = `${feature.label}: role permissions are required.`;
      continue;
    }

    for (const role of ACCESS_ROLES) {
      if (!(role in row)) {
        errors[`${key}_${role}`] = `${feature.label}: set access for ${role}.`;
      } else if (typeof row[role] !== "boolean") {
        errors[`${key}_${role}`] = `${feature.label} → ${role} must be allowed or denied.`;
      }
    }

    if (row.admin === false) {
      errors[`${key}_admin`] = "Restaurant admin access cannot be disabled.";
    }
  }

  for (const key of Object.keys(data)) {
    if (!ACCESS_FEATURE_KEYS.has(key)) {
      errors[`feature_${key}`] = `Unknown feature: ${key}.`;
    }
  }

  return errorsToResult(errors);
}

export function validateRestaurantSettingsPatch(settings, sections = null) {
  const validators = {
    general: () => validateRestaurantGeneral(settings?.general),
    pos: () => validateRestaurantPos(settings?.pos),
    contact: () => validateRestaurantContact(settings?.contact),
    email: () => validateRestaurantEmail(settings?.email),
    theme: () => validateRestaurantTheme(settings?.theme),
    notifications: () => validateRestaurantNotifications(settings?.notifications),
    openingHours: () => validateRestaurantOpeningHours(settings?.openingHours),
    accessControl: () => validateRestaurantAccessControl(settings?.accessControl),
  };

  const keys = sections?.length
    ? sections.filter((key) => validators[key])
    : Object.keys(validators);

  const tabs = {};
  let valid = true;
  let message = null;

  for (const key of keys) {
    const result = validators[key]();
    tabs[key] = result;
    if (!result.valid) {
      valid = false;
      message = message || result.message;
    }
  }

  return { valid, message, tabs };
}

export function validateWhatsappSettings({ enabled, token, phoneNumberId, alertPhone, templates }) {
  const errors = {};
  if (enabled) {
    const tokenTrim = trim(token);
    const hasToken = tokenTrim && !/^•{4,}$/.test(tokenTrim);
    if (!hasToken) errors.token = "API token is required when WhatsApp is enabled.";
    if (!trim(phoneNumberId)) errors.phoneNumberId = "Phone Number ID is required.";
    const alert = extractIndianMobileDigits(alertPhone);
    if (alert && !isValidIndianMobile(alert)) {
      errors.alertPhone = "Enter a valid 10-digit alert mobile number.";
    }
  }
  if (templates && typeof templates === "object") {
    for (const [id, tpl] of Object.entries(templates)) {
      if (tpl?.enabled && !trim(tpl?.message)) {
        errors[`template_${id}`] = "Message is required for enabled templates.";
      }
    }
  }
  return errorsToResult(errors);
}

export function validateWhatsappTestPhone(phone) {
  const err = indianPhoneError(phone);
  return err ? { valid: false, errors: { phone: err }, message: err } : { valid: true, errors: { phone: "" }, message: null };
}

const ONBOARDING_FIELD_KEYS = {
  1: ["mobile", "mobileVerified"],
  2: ["restaurantName", "restaurantType"],
  3: ["address", "city", "state", "pincode"],
  4: ["upiId"],
  5: [],
  6: [],
  7: [],
};

export function validateOnboardingStep(step, draft) {
  const errors = {};
  if (step === 1) {
    const phoneErr = indianPhoneError(draft.mobile);
    if (phoneErr) errors.mobile = phoneErr;
    if (!draft.mobileVerified) {
      errors.mobileVerified = "Verify your mobile number before continuing.";
    }
  }
  if (step === 2) {
    const nameErr = personNameError(draft.restaurantName, "Restaurant name");
    if (nameErr) errors.restaurantName = nameErr;
    if (!trim(draft.restaurantType)) errors.restaurantType = "Select a restaurant type.";
  }
  if (step === 3) {
    if (!trim(draft.address)) errors.address = "Street address is required.";
    if (!trim(draft.city)) errors.city = "City is required.";
    if (!trim(draft.state)) errors.state = "State is required.";
    const pin = trim(draft.pincode);
    if (!pin) errors.pincode = "Pincode is required.";
    else if (!/^\d{6}$/.test(pin)) errors.pincode = "Enter a valid 6-digit pincode.";
    const radius = Number(draft.deliveryRadius);
    if (!Number.isFinite(radius) || radius < 1 || radius > 30) {
      errors.deliveryRadius = "Delivery radius must be between 1 and 30 km.";
    }
  }
  if (step === 4) {
    const upi = trim(draft.upiId);
    const bank = trim(draft.bankName);
    const acc = trim(draft.accountNumber);
    const ifsc = trim(draft.ifscCode).toUpperCase();
    const anyBank = bank || acc || ifsc;
    if (upi && !UPI_RE.test(upi) && !isValidIndianMobile(extractIndianMobileDigits(upi))) {
      errors.upiId = "Enter a valid UPI ID.";
    }
    if (anyBank) {
      const bankVal = validatePaymentBank({
        accountHolderName: draft.restaurantName || "Holder",
        bankName: bank,
        accountNumber: acc,
        ifscCode: ifsc,
        upiId: "",
      });
      Object.assign(errors, bankVal.errors);
    }
  }
  if (step === 6) {
    const taxErr = priceError(draft.taxRate, { required: true });
    if (taxErr) errors.taxRate = taxErr.replace("Price", "Tax rate");
    const dcErr = priceError(draft.deliveryCharge, { required: true });
    if (dcErr) errors.deliveryCharge = dcErr.replace("Price", "Delivery charge");
  }
  const message = Object.values(errors).find(Boolean) ?? null;
  return { valid: !message, errors, message, fields: ONBOARDING_FIELD_KEYS[step] ?? [] };
}

export function validateOnboardingFinish(draft) {
  for (let s = 1; s <= 6; s++) {
    const r = validateOnboardingStep(s, draft);
    if (!r.valid) return r;
  }
  if (!draft.mobileVerified) {
    return {
      valid: false,
      errors: { mobileVerified: "Verify your mobile number in Step 1." },
      message: "Verify your mobile number in Step 1.",
    };
  }
  return { valid: true, errors: {}, message: null };
}

export function validateRestaurantCmsSection(section, data) {
  const errors = {};
  if (section === "hero") {
    const headline = trim(data?.headline);
    if (!headline) errors.headline = "Hero headline is required.";
    else if (headline.length < 3) errors.headline = "Headline must be at least 3 characters.";
    const sub = trim(data?.subheadline);
    if (sub && sub.length > 500) errors.subheadline = "Subheadline must be 500 characters or less.";
    const cta1 = optionalLinkError(data?.ctaPrimaryLink, "Primary button link");
    if (cta1) errors.ctaPrimaryLink = cta1;
    const cta2 = optionalLinkError(data?.ctaSecondaryLink, "Secondary button link");
    if (cta2) errors.ctaSecondaryLink = cta2;
    const img = optionalLinkError(data?.imageUrl, "Hero image URL");
    if (img) errors.imageUrl = img;
  }
  if (section === "announcement") {
    if (data?.enabled) {
      const text = trim(data?.text);
      if (!text) errors.text = "Announcement text is required when enabled.";
      else if (text.length > 200) errors.text = "Announcement must be 200 characters or less.";
      const link = optionalLinkError(data?.link, "Announcement link");
      if (link) errors.link = link;
    }
  }
  if (section === "about") {
    const headline = trim(data?.headline);
    if (headline && headline.length < 2) errors.headline = "Headline must be at least 2 characters.";
    const desc = trim(data?.description);
    if (desc && desc.length > 2000) errors.description = "Description must be 2000 characters or less.";
  }
  if (section === "banners" && Array.isArray(data)) {
    data.forEach((b, i) => {
      if (b?.enabled === false) return;
      const title = trim(b?.title);
      const image = trim(b?.image);
      if (!title && !image) {
        errors[`banner_${i}`] = `Banner ${i + 1}: add a title or image.`;
      }
      const link = optionalLinkError(b?.ctaLink, "Banner link");
      if (link) errors[`banner_${i}_link`] = link;
    });
  }
  if (section === "social") {
    for (const key of ["instagram", "facebook", "twitter", "youtube", "whatsapp"]) {
      const err = optionalLinkError(data?.[key], key);
      if (err) errors[key] = err;
    }
  }
  return errorsToResult(errors);
}

export function validateRestaurantCmsSectionServer(section, data) {
  const result = validateRestaurantCmsSection(section, data);
  if (!result.valid) {
    const err = new Error(result.message ?? "Invalid CMS content.");
    err.status = 422;
    throw err;
  }
  return data;
}

export function validateQrMenuConfig({ qrType, tableNumber, tableCount, baseUrl }) {
  const errors = {};
  if (!trim(baseUrl)) errors.baseUrl = "Customer site URL is not configured. Set restaurant slug in Super Admin.";
  if (qrType === "table") {
    if (!trim(tableNumber)) errors.tableNumber = "Select or enter a table number.";
  }
  if (qrType === "table" && !tableNumber) {
    const count = parseInt(String(tableCount ?? ""), 10);
    const countErr = positiveIntError(count, "Table count", { min: 1, max: 100 });
    if (countErr) errors.tableCount = countErr;
  }
  return errorsToResult(errors);
}

export function validatePasswordChangeForm(
  { current, next, confirm },
  passwordSecurity = DEFAULT_SIGNUP_PASSWORD_SECURITY
) {
  const errors = { current: "", next: "", confirm: "" };
  const cur = trim(current);
  const nxt = String(next ?? "");

  if (!cur) errors.current = "Current password is required.";

  const pwdErr = platformPasswordError(nxt, passwordSecurity);
  if (pwdErr) errors.next = pwdErr.replace(/^Password/, "New password");

  const matchErr = passwordMatchError(nxt, confirm);
  if (matchErr) errors.confirm = matchErr;

  if (cur && nxt && cur === nxt) {
    errors.next = "New password must be different from your current password.";
  }

  const message = Object.values(errors).find(Boolean) ?? null;
  return { valid: !message, errors, message };
}
