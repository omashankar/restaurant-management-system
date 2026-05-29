import { getAuthPayload } from "@/lib/tenantDb";
import clientPromise from "@/lib/mongodb";
import {
  staffOnboardingOtpVerifyLimiter,
  getClientIp,
} from "@/lib/rateLimit";
import { normalizePhoneForOtp } from "@/lib/phoneUtils";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function POST(request) {
  const payload = getAuthPayload(request);
  if (!payload) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = await staffOnboardingOtpVerifyLimiter.check(
    `onboarding-otp-verify:${payload.id}:${ip}`,
  );
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const phone = normalizePhoneForOtp(body?.phone);
  const otp = String(body?.otp ?? "").trim();
  if (!phone || !otp) {
    return Response.json(
      { success: false, error: "Phone and OTP are required." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const userId = new ObjectId(payload.id);

    const otpDoc = await db.collection("onboardingOtps").findOne(
      {
        userId,
        phone,
        used: false,
        expiresAt: { $gt: new Date() },
      },
      { sort: { createdAt: -1 } },
    );

    if (!otpDoc) {
      return Response.json(
        { success: false, error: "OTP expired or invalid." },
        { status: 400 },
      );
    }

    const ok = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!ok) {
      return Response.json({ success: false, error: "Invalid OTP." }, { status: 400 });
    }

    await db.collection("onboardingOtps").updateOne(
      { _id: otpDoc._id },
      { $set: { used: true, usedAt: new Date() } },
    );

    await db.collection("users").updateOne(
      { _id: userId },
      {
        $set: {
          phoneVerified: true,
          phone,
          updatedAt: new Date(),
        },
      },
    );

    return Response.json({ success: true, phone });
  } catch (err) {
    console.error("auth.onboarding.verify-otp failed:", err.message);
    return Response.json({ success: false, error: "Failed to verify OTP." }, { status: 500 });
  }
}
