import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { verifyTotpCode } from "@/lib/totp";
import { ObjectId } from "mongodb";

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = String(body?.code ?? "").trim();
  if (!code) {
    return Response.json({ success: false, error: "Enter the 6-digit code." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.id),
    });
    const secret = user?.twoFactorPendingSecret || user?.twoFactorSecret;
    if (!secret) {
      return Response.json({ success: false, error: "Start setup first." }, { status: 400 });
    }
    if (!verifyTotpCode(secret, code)) {
      return Response.json({ success: false, error: "Invalid code. Try again." }, { status: 400 });
    }

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          updatedAt: new Date(),
        },
        $unset: { twoFactorPendingSecret: "" },
      },
    );

    return Response.json({ success: true, message: "Two-factor authentication enabled." });
  } catch (err) {
    console.error("2fa confirm:", err.message);
    return Response.json({ success: false, error: "Confirmation failed." }, { status: 500 });
  }
}
