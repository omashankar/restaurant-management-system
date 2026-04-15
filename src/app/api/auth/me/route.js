import { getTokenFromRequest } from "@/lib/authCookies";
import { getUserById } from "@/lib/authService";
import { verifyToken } from "@/lib/jwt";

export async function GET(request) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ success: false, error: "Invalid or expired token." }, { status: 401 });
    }

    const user = await getUserById(payload.id);
    if (!user) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return Response.json({ success: true, user });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
