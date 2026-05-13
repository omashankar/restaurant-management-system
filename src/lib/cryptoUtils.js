/**
 * Lightweight AES-256-GCM encrypt/decrypt for storing gateway secrets.
 * Key is derived from PAYMENT_ENCRYPT_KEY env var (falls back to JWT_SECRET).
 */
import crypto from "node:crypto";

const ALGO = "aes-256-gcm";
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

function getKey() {
  const raw = process.env.PAYMENT_ENCRYPT_KEY || process.env.JWT_SECRET || "fallback-dev-key-change-in-prod";
  return crypto.createHash("sha256").update(raw).digest(); // always 32 bytes
}

/**
 * Encrypt a plaintext string.
 * Returns a base64 string: iv(12) + tag(16) + ciphertext
 */
export function encryptSecret(plaintext) {
  if (!plaintext) return "";
  const key = getKey();
  const iv = crypto.randomBytes(IV_LEN);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64 string produced by encryptSecret.
 * Returns empty string on failure (wrong key, corrupted data).
 */
export function decryptSecret(ciphertext) {
  if (!ciphertext) return "";
  try {
    const buf = Buffer.from(ciphertext, "base64");
    if (buf.length < IV_LEN + TAG_LEN + 1) return "";
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const encrypted = buf.subarray(IV_LEN + TAG_LEN);
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch {
    return "";
  }
}

/** Mask a secret for display: show last 4 chars, rest as asterisks */
export function maskSecret(value, visibleChars = 4) {
  if (!value || value.length <= visibleChars) return "••••••••";
  return "•".repeat(8) + value.slice(-visibleChars);
}

export const SECRET_MASK = "••••••••";
export function isSecretMask(value) {
  return !value || value === SECRET_MASK || /^•+$/.test(String(value));
}
