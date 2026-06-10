import clientPromise from "@/lib/mongodb";
import {
  customerOtpRequestLimiter,
  getClientIp,
} from "@/lib/rateLimit";
import { normalizePhoneForOtp } from "@/lib/phoneUtils";
import bcrypt from "bcryptjs";
import { sendPlatformSms } from "@/lib/smsService";

const OTP_EXPIRY_MINUTES = 2;

function makeOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await customerOtpRequestLimiter.check(`customer-otp-req:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many requests. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  const phone = normalizePhoneForOtp(body?.phone);
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!phone) {
    return Response.json({ success: false, error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const otp = makeOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

    await db.collection("customerOtps").insertOne({
      phone,
      otpHash,
      expiresAt,
      used: false,
      createdAt: new Date(),
      ip,
    });

    if (name || email) {
      await db.collection("customerAccounts").updateOne(
        { phone },
        {
          $setOnInsert: { createdAt: new Date() },
          $set: {
            ...(name ? { name } : {}),
            ...(email ? { email } : {}),
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const smsResult = await sendPlatformSms(
      db,
      phone,
      `Your BhojDesk login OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`,
    );

    const response = {
      success: true,
      message: smsResult.sent
        ? "OTP sent to your mobile."
        : "OTP generated. Check SMS settings if you did not receive a text.",
      expiresInSec: OTP_EXPIRY_MINUTES * 60,
      smsSent: smsResult.sent,
    };

    if (!smsResult.sent && process.env.NODE_ENV !== "production") {
      response.devOtp = otp;
    }

    return Response.json(response);
  } catch (err) {
    console.error("customer.auth.request-otp failed:", err.message);
    return Response.json({ success: false, error: "Failed to send OTP." }, { status: 500 });
  }
}
