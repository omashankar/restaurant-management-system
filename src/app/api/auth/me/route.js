import { TOKEN_COOKIE } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    /* ── Get token from cookie OR Authorization header ── */
    let token = request.cookies.get(TOKEN_COOKIE)?.value;

    if (!token) {
      const authHeader = request.headers.get("authorization") ?? "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    /* ── Verify JWT ── */
    const payload = verifyToken(token);
    if (!payload?.id) {
      return Response.json({ success: false, error: "Invalid or expired token." }, { status: 401 });
    }

    /* ── Fetch user from DB ── */
    let _id;
    try { _id = new ObjectId(payload.id); }
    catch { return Response.json({ success: false, error: "Invalid user ID." }, { status: 401 }); }

    const client = await clientPromise;
    const db     = client.db();

    const user = await db.collection("users").findOne(
      { _id },
      { projection: { password: 0 } }   // never return password
    );

    if (!user) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id:           user._id.toString(),
        name:         user.name,
        email:        user.email,
        role:         user.role,
        restaurantId: user.restaurantId?.toString() ?? null,
        isVerified:   user.isVerified ?? true,
      },
    });

  } catch (err) {
    console.error("/api/auth/me error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
