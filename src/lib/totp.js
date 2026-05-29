import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  let bits = "";
  for (const b of bytes) bits += b.toString(2).padStart(8, "0");
  let secret = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, "0");
    secret += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return secret.slice(0, 32);
}

function base32Decode(secret) {
  const normalized = String(secret).toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (const char of normalized) {
    const val = BASE32_ALPHABET.indexOf(char);
    if (val < 0) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function hotp(secret, counter, digits = 6) {
  const key = base32Decode(secret);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function generateTotpCode(secret, step = 30, digits = 6, timeMs = Date.now()) {
  const counter = Math.floor(timeMs / 1000 / step);
  return hotp(secret, counter, digits);
}

/** Accept current ±1 window */
export function verifyTotpCode(secret, code, step = 30, digits = 6) {
  const normalized = String(code ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;
  const now = Date.now();
  for (let w = -1; w <= 1; w += 1) {
    const expected = generateTotpCode(secret, step, digits, now + w * step * 1000);
    if (expected === normalized) return true;
  }
  return false;
}

export function getOtpAuthUrl({ secret, label, issuer = "RMS" }) {
  const enc = encodeURIComponent;
  return `otpauth://totp/${enc(issuer)}:${enc(label)}?secret=${secret}&issuer=${enc(issuer)}&algorithm=SHA1&digits=6&period=30`;
}
