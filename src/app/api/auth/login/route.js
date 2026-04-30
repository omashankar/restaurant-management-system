import { setRefreshTokenCookie, setTokenCookie } from "@/lib/authCookies";
import { signRefreshToken, signToken } from "@/lib/jwt";
import { logError, logInfo } from "@/lib/logger";
import { getClientIp, loginLimiter } from "@/lib/rateLimit";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  /* ── Rate limit ── */
  const ip = getClientIp(request);
  const limit = await loginLimiter.check(ip);
  const body = await request.json().catch(() => null);
  const emailKey = `${ip}:${String(body?.email ?? "").toLowerCase().trim() || "unknown"}`;
  const emailLimit = await loginLimiter.check(emailKey);
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
  if (!body) return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });

  const { email, password, rememberMe = false } = body ?? {};

  if (!email?.trim() || !password) {
    return Response.json({ success: false, error: "Email and password are required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    /* ── Find user by email ── */
    const user = await db.collection("users").findOne({
      email: email.toLowerCase().trim(),
    });

    /* ── User not found OR wrong password → same message (prevent enumeration) ── */
    if (!user) {
      return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    /* ── Secure password compare using bcrypt ── */
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    /* ── Block inactive accounts ── */
    const userStatus = user.status ?? "active"; // treat missing as active
    if (userStatus !== "active") {
      return Response.json(
        { success: false, error: "Your account is inactive. Please contact support.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

    /* ── Block unverified accounts (skip for super_admin) ── */
    const isVerified = user.isVerified ?? true; // treat missing as verified
    if (!isVerified && user.role !== "super_admin") {
      return Response.json(
        { success: false, error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    /* ── Build user payload ── */
    const userPayload = {
      id:           user._id.toString(),
      name:         user.name,
      email:        user.email,
      role:         user.role,
      restaurantId: user.restaurantId?.toString() ?? null,
      status:       user.status,
    };

    /* ── Issue JWT ── */
    const token = signToken({
      id:           userPayload.id,
      role:         userPayload.role,
      restaurantId: userPayload.restaurantId,
    });

    const refreshToken = signRefreshToken({
      id: userPayload.id,
      role: userPayload.role,
      restaurantId: userPayload.restaurantId,
      type: "refresh",
    });
    const res = Response.json({ success: true, user: userPayload });
    logInfo("auth.login.success", { email: userPayload.email, role: userPayload.role });
    return setRefreshTokenCookie(setTokenCookie(res, token, rememberMe), refreshToken);

  } catch (err) {
    logError("auth.login.failed", err, { route: "/api/auth/login" });
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
