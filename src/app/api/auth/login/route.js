import { setTokenCookie } from "@/lib/authCookies";
import { verifyUser } from "@/lib/authService";
import { signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const { email, password, rememberMe = false } = await request.json();

    if (!email?.trim() || !password) {
      return Response.json({ success: false, error: "Email and password are required." }, { status: 400 });
    }

    const user = await verifyUser({ email, password });
    const token = signToken({ id: user.id, role: user.role, restaurantId: user.restaurantId });

    const res = Response.json({ success: true, user });
    return setTokenCookie(res, token, rememberMe);
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return Response.json({ success: false, error: "No account found with this email." }, { status: 404 });
    }
    if (err.message === "WRONG_PASSWORD") {
      return Response.json({ success: false, error: "Incorrect password." }, { status: 401 });
    }
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
