import { normalizePhoneForOtp } from "@/lib/phoneUtils";

const STORAGE_KEY = "customer_auth_dev_otp";
const TTL_MS = 2 * 60_000;

/** Keep dev OTP across login → verify redirect when SMS is not configured. */
export function storeCustomerDevOtp(phone, otp) {
  if (typeof sessionStorage === "undefined" || !otp) return;
  const normalized = normalizePhoneForOtp(phone);
  if (!normalized) return;
  sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ phone: normalized, otp: String(otp), at: Date.now() }),
  );
}

export function readCustomerDevOtp(phone) {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const normalized = normalizePhoneForOtp(phone);
    if (!parsed?.otp || parsed.phone !== normalized) return null;
    if (Date.now() - Number(parsed.at) > TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return String(parsed.otp);
  } catch {
    return null;
  }
}

export function clearCustomerDevOtp() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
