import clientPromise from "@/lib/mongodb";
import {
  customerOtpVerifyLimiter,
  getClientIp,
} from "@/lib/rateLimit";
import {
  setCustomerTokenCookie,
  signCustomerToken,
} from "@/lib/customerAuth";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await customerOtpVerifyLimiter.check(`customer-otp-verify:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  const phone = String(body?.phone ?? "").trim();
  const otp = String(body?.otp ?? "").trim();
  if (!phone || !otp) {
    return Response.json({ success: false, error: "Phone and OTP are required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const otpDoc = await db.collection("customerOtps").findOne(
      { phone, used: false, expiresAt: { $gt: new Date() } },
      { sort: { createdAt: -1 } }
    );
    if (!otpDoc) {
      return Response.json({ success: false, error: "OTP expired or invalid." }, { status: 400 });
    }

    const ok = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!ok) {
      return Response.json({ success: false, error: "Invalid OTP." }, { status: 400 });
    }

    await db.collection("customerOtps").updateOne({ _id: otpDoc._id }, { $set: { used: true, usedAt: new Date() } });

    const now = new Date();
    await db.collection("customerAccounts").updateOne(
      { phone },
      {
        $setOnInsert: { createdAt: now },
        $set: { phone, lastLoginAt: now, updatedAt: now, authMethod: "otp" },
      },
      { upsert: true }
    );
    const account = await db.collection("customerAccounts").findOne({ phone });
    if (!account) {
      return Response.json({ success: false, error: "Account setup failed." }, { status: 500 });
    }

    const token = signCustomerToken({
      id: String(account._id),
      phone: account.phone,
      email: account.email ?? null,
      name: account.name ?? "",
    });

    const res = Response.json({
      success: true,
      user: {
        id: String(account._id),
        phone: account.phone,
        email: account.email ?? null,
        name: account.name ?? "",
      },
    });
    return setCustomerTokenCookie(res, token, true);
  } catch (err) {
    console.error("customer.auth.verify-otp failed:", err.message);
    return Response.json({ success: false, error: "Failed to verify OTP." }, { status: 500 });
  }
}
