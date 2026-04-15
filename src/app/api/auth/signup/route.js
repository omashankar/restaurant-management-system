import { setTokenCookie } from "@/lib/authCookies";
import { createUser } from "@/lib/authService";
import { signToken } from "@/lib/jwt";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password, role, restaurantName } = body;

    // Validation
    if (!name?.trim() || !email?.trim() || !password || !role) {
      return Response.json({ success: false, error: "All fields are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const validRoles = ["admin", "manager", "waiter", "chef"];
    if (!validRoles.includes(role)) {
      return Response.json({ success: false, error: "Invalid role." }, { status: 400 });
    }

    const user = await createUser({ name, email, password, role, restaurantName });

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
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
