import {
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
  setTokenCookie,
} from "@/lib/authCookies";
import { signRefreshToken, signToken, verifyToken } from "@/lib/jwt";

export async function POST(request) {
  const refreshToken = getRefreshTokenFromRequest(request);
  if (!refreshToken) {
    return Response.json({ success: false, error: "Refresh token missing." }, { status: 401 });
  }
  const payload = verifyToken(refreshToken);
  if (!payload?.id || payload?.type !== "refresh") {
    return Response.json({ success: false, error: "Invalid refresh token." }, { status: 401 });
  }

  const accessToken = signToken({
    id: payload.id,
    role: payload.role,
    restaurantId: payload.restaurantId ?? null,
  });
  const rotatedRefresh = signRefreshToken({
    id: payload.id,
    role: payload.role,
    restaurantId: payload.restaurantId ?? null,
    type: "refresh",
  });

  const response = Response.json({ success: true });
  return setRefreshTokenCookie(setTokenCookie(response, accessToken, true), rotatedRefresh);
}
