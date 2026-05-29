import { signToken, verifyToken } from "@/lib/jwt";
import { generateTotpSecret, verifyTotpCode } from "@/lib/totp";

export { generateTotpSecret, verifyTotpCode };

export function sign2FAChallenge(userId, rememberMe = false) {
  return signToken(
    { id: userId, type: "2fa_challenge", rememberMe: !!rememberMe },
    "5m",
  );
}

export function verify2FAChallenge(token) {
  const payload = verifyToken(token);
  if (!payload || payload.type !== "2fa_challenge" || !payload.id) return null;
  return payload;
}

export function userRequires2FA(user, platformSecurity) {
  if (!platformSecurity?.enable2FA) return false;
  if (user.role === "super_admin") return Boolean(user.twoFactorSecret);
  return Boolean(user.twoFactorSecret);
}
