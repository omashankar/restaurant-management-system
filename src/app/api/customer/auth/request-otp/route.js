import clientPromise from "@/lib/mongodb";
import {
  customerOtpRequestLimiter,
  getClientIp,
} from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

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
  const phone = String(body?.phone ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  if (!/^\+?[0-9]{8,15}$/.test(phone.replace(/\s|-/g, ""))) {
    return Response.json({ success: false, error: "Enter a valid phone number." }, { status: 400 });
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

    const response = {
      success: true,
      message: "OTP sent successfully.",
      expiresInSec: OTP_EXPIRY_MINUTES * 60,
    };

    // Dev convenience; remove in production.
    if (process.env.NODE_ENV !== "production") {
      response.devOtp = otp;
    }

    return Response.json(response);
  } catch (err) {
    console.error("customer.auth.request-otp failed:", err.message);
    return Response.json({ success: false, error: "Failed to send OTP." }, { status: 500 });
  }
}
