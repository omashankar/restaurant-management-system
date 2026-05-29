import { getClientIp, resendLimiter } from "@/lib/rateLimit";
import clientPromise from "@/lib/mongodb";
import { getPlatformSettings } from "@/lib/platformSettings";
import { validatePlatformPassword } from "@/lib/platformPassword";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await resendLimiter.check(`reset:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const token = String(body?.token ?? "").trim();
  const password = String(body?.password ?? "");
  const confirmPassword = String(body?.confirmPassword ?? "");

  if (!token) {
    return Response.json({ success: false, error: "Reset token is required." }, { status: 400 });
  }
  const client = await clientPromise;
  const db = client.db();
  const platform = await getPlatformSettings(db);
  const pwdCheck = validatePlatformPassword(password, platform.security);
  if (!pwdCheck.valid) {
    return Response.json({ success: false, error: pwdCheck.error }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return Response.json({ success: false, error: "Passwords do not match." }, { status: 400 });
  }

  try {
    const user = await db.collection("users").findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) {
      return Response.json(
        { success: false, error: "Reset link is invalid or expired." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $unset: {
          passwordResetToken: "",
          passwordResetExpires: "",
        },
      }
    );

    return Response.json({ success: true, message: "Password reset successful." });
  } catch {
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
