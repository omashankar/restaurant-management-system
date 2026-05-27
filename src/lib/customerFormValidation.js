import {
  extractIndianMobileDigits,
  isValidIndianMobile,
  toIndianE164,
} from "@/lib/phoneUtils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Guest / customer name: ≥2 chars, at least one letter (Latin or Devanagari). */
export function isValidGuestName(name) {
  const trimmed = String(name ?? "").trim();
  return trimmed.length >= 2 && /[a-zA-Z\u0900-\u097F]/.test(trimmed);
}

export function isValidEmail(email) {
  const trimmed = String(email ?? "").trim();
  return trimmed.length > 0 && EMAIL_RE.test(trimmed);
}

/** Checkout: phone or email required; if phone typed, must be valid Indian mobile. */
export function validateCheckoutContact({ phone, email }) {
  const digits = extractIndianMobileDigits(phone);
  const phoneOk = isValidIndianMobile(digits);
  const emailOk = isValidEmail(email);
  if (!phoneOk && !emailOk) {
    return {
      ok: false,
      error: "Add a valid 10-digit mobile number or a valid email.",
    };
  }
  if (digits.length > 0 && !phoneOk) {
    return { ok: false, error: "Enter a valid 10-digit mobile number." };
  }
  if (String(email ?? "").trim() && !emailOk) {
    return { ok: false, error: "Enter a valid email address." };
  }
  return {
    ok: true,
    phoneE164: phoneOk ? toIndianE164(digits) : "",
    email: emailOk ? String(email).trim().toLowerCase() : "",
  };
}

export function isValidContactMessage(message) {
  return String(message ?? "").trim().length >= 10;
}

export function isValidGuestCount(value, { min = 1, max = 20 } = {}) {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n >= min && n <= max;
}
