import { sendPasswordResetEmail } from "@/lib/emailService";
import { getClientIp, resendLimiter } from "@/lib/rateLimit";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await resendLimiter.check(`forgot:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!email) {
    return Response.json({ success: false, error: "Email is required." }, { status: 400 });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection("users").findOne({ email });

    // Do not reveal user existence.
    if (!user) {
      return Response.json({
        success: true,
        message: "If this email is registered, reset instructions have been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: token,
          passwordResetExpires: expires,
          updatedAt: new Date(),
        },
      }
    );

    const emailResult = await sendPasswordResetEmail({
      name: user.name ?? "User",
      email,
      token,
      baseUrl,
    });

    const payload = {
      success: true,
      message: "If this email is registered, reset instructions have been sent.",
    };

    if (!emailResult.success && process.env.NODE_ENV !== "production") {
      payload.devResetLink = `${baseUrl}/reset-password?token=${token}`;
      payload.message = "Email failed in dev mode. Use the reset link below.";
    }

    return Response.json(payload);
  } catch {
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
