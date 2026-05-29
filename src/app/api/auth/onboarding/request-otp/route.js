import { getAuthPayload } from "@/lib/tenantDb";
import clientPromise from "@/lib/mongodb";
import {
  staffOnboardingOtpRequestLimiter,
  getClientIp,
} from "@/lib/rateLimit";
import { normalizePhoneForOtp } from "@/lib/phoneUtils";
import { sendPlatformSms } from "@/lib/smsService";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

const OTP_EXPIRY_MINUTES = 2;

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request) {
  const payload = getAuthPayload(request);
  if (!payload) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  const ip = getClientIp(request);
  const limit = await staffOnboardingOtpRequestLimiter.check(
    `onboarding-otp-req:${payload.id}:${ip}`,
  );
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await request.json().catch(() => null);
  const phone = normalizePhoneForOtp(body?.phone);
  if (!phone) {
    return Response.json(
      { success: false, error: "Enter a valid 10-digit mobile number." },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const otp = makeOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

    await db.collection("onboardingOtps").insertOne({
      userId: new ObjectId(payload.id),
      restaurantId: payload.restaurantId
        ? new ObjectId(payload.restaurantId)
        : null,
      phone,
      otpHash,
      expiresAt,
      used: false,
      createdAt: new Date(),
      ip,
    });

    const smsResult = await sendPlatformSms(
      db,
      phone,
      `Your RMS onboarding OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    );

    const response = {
      success: true,
      message: smsResult.sent
        ? "OTP sent to your mobile."
        : "OTP generated. Check Super Admin SMS settings if you did not receive a text.",
      expiresInSec: OTP_EXPIRY_MINUTES * 60,
      smsSent: smsResult.sent,
    };

    if (!smsResult.sent && process.env.NODE_ENV !== "production") {
      response.devOtp = otp;
    }

    return Response.json(response);
  } catch (err) {
    console.error("auth.onboarding.request-otp failed:", err.message);
    return Response.json({ success: false, error: "Failed to send OTP." }, { status: 500 });
  }
}
