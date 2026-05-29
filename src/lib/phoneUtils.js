/** Indian mobile: 10 digits, leading digit 6–9 */
export function sanitizeIndianMobileDigits(value) {
  return String(value ?? "").replace(/\D/g, "").slice(0, 10);
}

/** Strip +91 / spaces; keep last 10 digits when a full number was pasted. */
export function extractIndianMobileDigits(phone) {
  let digits = sanitizeIndianMobileDigits(
    String(phone ?? "")
      .trim()
      .replace(/^\+91/, "")
  );
  if (digits.length > 10) digits = digits.slice(-10);
  return digits;
}

export function isValidIndianMobile(digits) {
  return /^[6-9]\d{9}$/.test(String(digits ?? "").trim());
}

export function toIndianE164(digits) {
  const d = extractIndianMobileDigits(digits);
  return d ? `+91${d}` : "";
}

/** Normalize for OTP / auth APIs (E.164 +91). */
export function normalizePhoneForOtp(phone) {
  const digits = extractIndianMobileDigits(phone);
  return isValidIndianMobile(digits) ? toIndianE164(digits) : "";
}
