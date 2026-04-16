import { createUser } from "@/lib/authService";
import { setTokenCookie } from "@/lib/authCookies";
import { signToken } from "@/lib/jwt";
import { getClientIp, signupLimiter } from "@/lib/rateLimit";
import { parseSchema, signupSchema } from "@/lib/validationSchemas";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = signupLimiter.check(ip);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many signup attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, password, role, restaurantName } = parseSchema(signupSchema, body);

    if (role === "admin" && !restaurantName?.trim()) {
      return Response.json(
        { success: false, error: "Restaurant name is required for Admin." },
        { status: 400 }
      );
    }

    const user = await createUser({ name, email, password, role, restaurantName });

    // Set JWT cookie — auto login
    const token = signToken({ id: user.id, role: user.role, restaurantId: user.restaurantId });
    const res = Response.json({ success: true, user });
    return setTokenCookie(res, token);
  } catch (err) {
    if (err.message === "EMAIL_EXISTS") {
      return Response.json({ success: false, error: "Email already registered." }, { status: 409 });
    }
    if (err.message === "RESTAURANT_NAME_REQUIRED") {
      return Response.json({ success: false, error: "Restaurant name is required for Admin." }, { status: 400 });
    }
    if (err.message && err.message.length < 120) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }
    console.error("Signup error:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
