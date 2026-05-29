import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { generateTotpSecret, getOtpAuthUrl } from "@/lib/totp";
import { ObjectId } from "mongodb";
import QRCode from "qrcode";

export async function POST(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload?.id) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection("users").findOne({
      _id: new ObjectId(payload.id),
    });
    if (!user) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const secret = generateTotpSecret();
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          twoFactorPendingSecret: secret,
          updatedAt: new Date(),
        },
      },
    );

    const otpauthUrl = getOtpAuthUrl({
      secret,
      label: user.email,
      issuer: "RMS",
    });
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

    return Response.json({
      success: true,
      secret,
      otpauthUrl,
      qrDataUrl,
    });
  } catch (err) {
    console.error("2fa setup:", err.message);
    return Response.json({ success: false, error: "Setup failed." }, { status: 500 });
  }
}
