import {
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
  setTokenCookie,
  TOKEN_COOKIE,
} from "@/lib/authCookies";
import { signRefreshToken, signToken, verifyToken, verifyTokenDetailed } from "@/lib/jwt";
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
    let payload = verifyToken(token);
    if (!payload?.id) {
      const detailed = token ? verifyTokenDetailed(token) : { code: "invalid" };
      if (detailed.code !== "expired") {
        return Response.json({ success: false, error: "Invalid or expired token." }, { status: 401 });
      }

      const refreshToken = getRefreshTokenFromRequest(request);
      const refreshPayload = refreshToken ? verifyToken(refreshToken) : null;
      if (!refreshPayload?.id || refreshPayload?.type !== "refresh") {
        return Response.json({ success: false, error: "Session expired. Please login again." }, { status: 401 });
      }
      payload = refreshPayload;
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

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId?.toString() ?? null,
      isVerified: user.isVerified ?? true,
    };

    let response = Response.json({
      success: true,
      user: userPayload,
    });
    const maybeExpired = verifyTokenDetailed(token ?? "").code === "expired";
    if (maybeExpired) {
      const newAccess = signToken({
        id: userPayload.id,
        role: userPayload.role,
        restaurantId: userPayload.restaurantId,
      });
      const newRefresh = signRefreshToken({
        id: userPayload.id,
        role: userPayload.role,
        restaurantId: userPayload.restaurantId,
        type: "refresh",
      });
      response = setRefreshTokenCookie(setTokenCookie(response, newAccess, true), newRefresh);
    }
    return response;

  } catch (err) {
    console.error("/api/auth/me error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
