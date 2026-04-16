import { setTokenCookie } from "@/lib/authCookies";
import { verifyUser } from "@/lib/authService";
import { signToken } from "@/lib/jwt";
import { getClientIp, loginLimiter } from "@/lib/rateLimit";
import { loginSchema, parseSchema } from "@/lib/validationSchemas";

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

  try {
    /* ── Validate input ── */
    const body = await request.json();
    const { email, password, rememberMe } = parseSchema(loginSchema, body);

    /* ── Verify credentials ── */
    const user = await verifyUser({ email, password });

    /* ── Issue JWT ── */
    const token = signToken({
      id: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
    });

    const res = Response.json({ success: true, user });
    return setTokenCookie(res, token, rememberMe);

  } catch (err) {
    /* ── Specific known errors ── */
    if (err.message === "EMAIL_NOT_VERIFIED") {
      return Response.json(
        { success: false, error: "Please verify your email before logging in.", code: "EMAIL_NOT_VERIFIED" },
        { status: 403 }
      );
    }

    /* ── USER_NOT_FOUND + WRONG_PASSWORD → same message (prevent user enumeration) ── */
    if (err.message === "USER_NOT_FOUND" || err.message === "WRONG_PASSWORD") {
      return Response.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    /* ── Validation errors ── */
    if (err.message && !err.message.includes("Internal")) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }

    /* ── Generic — never expose internals ── */
    console.error("Login error:", err.message);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
