/**
 * Password rules from Super Admin → Security settings.
 * Default policy is soft (length only). Numbers / special chars are opt-in.
 * @param {string} password
 * @param {object} [security]
 */
export function validatePlatformPassword(password, security = {}) {
  const minLen = Math.max(
    6,
    Math.min(32, Number(security.minPasswordLength ?? 6) || 6),
  );
  const pwd = String(password ?? "");

  if (pwd.length < minLen) {
    return {
      valid: false,
      error: `Password must be at least ${minLen} characters.`,
    };
  }
  if (security.requireNumbers === true && !/\d/.test(pwd)) {
    return { valid: false, error: "Password must include at least one number." };
  }
  if (security.requireSpecialChars === true && !/[^A-Za-z0-9]/.test(pwd)) {
    return {
      valid: false,
      error: "Password must include at least one special character.",
    };
  }
  return { valid: true };
}

/** @param {string} ip */
export function isIpAllowedForSuperAdmin(ip, security = {}) {
  const raw = String(security.ipWhitelist ?? "").trim();
  if (!raw) return true;
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return allowed.includes(ip);
}
