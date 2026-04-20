import { setTokenCookie } from "@/lib/authCookies";
import { signToken } from "@/lib/jwt";
import { getClientIp, loginLimiter } from "@/lib/rateLimit";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export async function POST(request) {
  /* ── Rate limit ── */
  const ip = getClientIp(request);
  const limit = loginLimiter.check(ip);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many login attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 }); }

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
    if (user.status && user.status !== "active") {
      return Response.json(
        { success: false, error: "Your account is inactive. Please contact support.", code: "ACCOUNT_INACTIVE" },
        { status: 403 }
      );
    }

    /* ── Block unverified accounts (skip for super_admin) ── */
    if (!user.isVerified && user.role !== "super_admin") {
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

    const res = Response.json({ success: true, user: userPayload });
    return setTokenCookie(res, token, rememberMe);

  } catch (err) {
    console.error("Login error:", err.message);
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
