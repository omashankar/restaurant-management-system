import { writeAuditLog } from "@/lib/auditLog";
import { setRefreshTokenCookie, setTokenCookie } from "@/lib/authCookies";
import { signRefreshToken, signToken } from "@/lib/jwt";
import { logError, logInfo } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rateLimit";
import clientPromise from "@/lib/mongodb";
import { getPlatformSettings } from "@/lib/platformSettings";
import { isIpAllowedForSuperAdmin } from "@/lib/platformPassword";
import { sign2FAChallenge, userRequires2FA } from "@/lib/twoFactor";
import bcrypt from "bcryptjs";
import { parseSchema, loginSchema } from "@/lib/validationSchemas";

export async function POST(request) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => null);

  const client = await clientPromise;
  const db = client.db();
  const platform = await getPlatformSettings(db);
  const security = platform.security ?? {};

  const isDev = process.env.NODE_ENV !== "production";
  const maxAttempts = Math.max(3, Number(security.loginAttemptLimit ?? 10) || 10);
  const windowMs = Math.max(
    60_000,
    (Number(security.blockDurationMinutes ?? 15) || 15) * 60_000,
  );
  const dynamicLimiter = rateLimit({ windowMs, max: maxAttempts });

  // Local dev: skip login rate limit (audit scripts / repeated demo logins should not lock you out).
  if (!isDev) {
    const limit = await dynamicLimiter.check(ip);
    const emailKey = `${ip}:${String(body?.email ?? "").toLowerCase().trim() || "unknown"}`;
    const emailLimit = await dynamicLimiter.check(emailKey);
    if (!limit.allowed) {
      return Response.json(
        { success: false, error: `Too many login attempts. Try again in ${limit.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }
    if (!emailLimit.allowed) {
      return Response.json(
        { success: false, error: `Too many login attempts. Try again in ${emailLimit.retryAfter}s.` },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
      );
    }
  }
  if (!body) return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });

  let email;
  let password;
  let rememberMe;
  try {
    ({ email, password, rememberMe } = parseSchema(loginSchema, body));
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  try {
    /* ── Find user by email ── */
    const user = await db.collection("users").findOne({
      email,
    });

    /* ── User not found OR wrong password → same message (prevent enumeration) ── */
    if (!user) {
      return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    /* ── Secure password compare using bcrypt ── */
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      if (user.role === "super_admin") {
        await writeAuditLog({
          action: "auth.failed",
          category: "auth",
          targetId: user._id.toString(),
          targetName: user.email,
          ip,
        });
      }
      return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    /* ── Block inactive accounts (pending = awaiting email verification) ── */
    const userStatus = user.status ?? "active";
    if (userStatus !== "active" && userStatus !== "pending") {
      return Response.json(
        { success: false, error: "Your account is inactive. Please contact support.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

    if (user.role === "super_admin" && !isIpAllowedForSuperAdmin(ip, security)) {
      return Response.json(
        { success: false, error: "Login not allowed from this IP address.", code: "IP_NOT_ALLOWED" },
        { status: 403 },
      );
    }

    if (userRequires2FA(user, security)) {
      return Response.json({
        success: false,
        requires2FA: true,
        challengeToken: sign2FAChallenge(user._id.toString(), rememberMe),
        message: "Enter the 6-digit code from your authenticator app.",
      });
    }

    /* ── Email verification required before login ── */
    const isVerified = user.isVerified ?? true;
    if (!isVerified && user.role !== "super_admin") {
      return Response.json(
        {
          success: false,
          error: "Please verify your email before logging in.",
          code: "EMAIL_NOT_VERIFIED",
        },
        { status: 403 },
      );
    }

    /* ── Build user payload ── */
    const userPayload = {
      id:           user._id.toString(),
      name:         user.name,
      email:        user.email,
      phone:        user.phone ?? "",
      avatarUrl:    user.avatarUrl ?? "",
      role:         user.role,
      restaurantId: user.restaurantId?.toString() ?? null,
      status:       user.status,
    };

    const sessionMinutes = Math.min(
      24 * 60,
      Math.max(15, Number(security.sessionTimeoutMinutes ?? 60) || 60),
    );
    const token = signToken(
      {
        id: userPayload.id,
        role: userPayload.role,
        restaurantId: userPayload.restaurantId,
      },
      `${sessionMinutes}m`,
    );

    const refreshToken = signRefreshToken({
      id: userPayload.id,
      role: userPayload.role,
      restaurantId: userPayload.restaurantId,
      type: "refresh",
    });
    const res = Response.json({
      success: true,
      user: userPayload,
      requires2FASetup:
        Boolean(security.enable2FA) &&
        userPayload.role === "super_admin" &&
        !user.twoFactorSecret,
    });
    logInfo("auth.login.success", { email: userPayload.email, role: userPayload.role });
    if (userPayload.role === "super_admin") {
      await writeAuditLog({
        action: "auth.login",
        category: "auth",
        actorId: userPayload.id,
        actorName: userPayload.name,
        ip,
      });
    }
    return setRefreshTokenCookie(setTokenCookie(res, token, rememberMe), refreshToken);

  } catch (err) {
    logError("auth.login.failed", err, { route: "/api/auth/login" });
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
