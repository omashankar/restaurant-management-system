import { writeAuditLog } from "@/lib/auditLog";
import { setRefreshTokenCookie, setTokenCookie } from "@/lib/authCookies";
import { signRefreshToken, signToken } from "@/lib/jwt";
import { logInfo } from "@/lib/logger";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import { getPlatformSettings } from "@/lib/platformSettings";
import { verify2FAChallenge } from "@/lib/twoFactor";
import { verifyTotpCode } from "@/lib/totp";
import { ObjectId } from "mongodb";

export async function POST(request) {
  const ip = getClientIp(request);
  const body = await request.json().catch(() => null);
  const challengeToken = String(body?.challengeToken ?? "").trim();
  const code = String(body?.code ?? "").trim();

  if (!challengeToken || !code) {
    return Response.json(
      { success: false, error: "Challenge token and code are required." },
      { status: 400 },
    );
  }

  const challenge = verify2FAChallenge(challengeToken);
  if (!challenge) {
    return Response.json(
      { success: false, error: "Session expired. Sign in again." },
      { status: 401 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(challenge.id),
    });
    if (!user?.twoFactorSecret) {
      return Response.json({ success: false, error: "2FA not configured." }, { status: 400 });
    }
    if (!verifyTotpCode(user.twoFactorSecret, code)) {
      return Response.json({ success: false, error: "Invalid authentication code." }, { status: 401 });
    }

    const platform = await getPlatformSettings(db);
    const sessionMinutes = Math.min(
      24 * 60,
      Math.max(15, Number(platform.security?.sessionTimeoutMinutes ?? 60) || 60),
    );

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId?.toString() ?? null,
      status: user.status,
    };

    const token = signToken(
      {
        id: userPayload.id,
        role: userPayload.role,
        restaurantId: userPayload.restaurantId,
      },
      `${sessionMinutes}m`,
    );
    const refreshToken = signRefreshToken({
      id: userPayload.id,
      role: userPayload.role,
      restaurantId: userPayload.restaurantId,
      type: "refresh",
    });

    const rememberMe = !!challenge.rememberMe;
    const res = Response.json({ success: true, user: userPayload });
    logInfo("auth.login.2fa.success", { email: userPayload.email });

    if (userPayload.role === "super_admin") {
      await writeAuditLog({
        action: "auth.login",
        category: "auth",
        actorId: userPayload.id,
        actorName: userPayload.name,
        ip,
        meta: { twoFactor: true },
      });
    }

    return setRefreshTokenCookie(setTokenCookie(res, token, rememberMe), refreshToken);
  } catch (err) {
    console.error("2fa verify-login:", err.message);
    return Response.json({ success: false, error: "Verification failed." }, { status: 500 });
  }
}
