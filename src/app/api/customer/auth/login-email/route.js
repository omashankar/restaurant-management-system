import clientPromise from "@/lib/mongodb";
import { loginLimiter, getClientIp } from "@/lib/rateLimit";
import { setCustomerTokenCookie, signCustomerToken } from "@/lib/customerAuth";
import { serializeCustomerUser } from "@/lib/customerAccountSerialize";
import { emailFormatError } from "@/lib/emailValidation";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await loginLimiter.check(`customer-login:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const emailErr = emailFormatError(email);
  if (emailErr) {
    return Response.json(
      { success: false, error: emailErr, errors: { email: emailErr } },
      { status: 422 }
    );
  }
  if (!password) {
    return Response.json({ success: false, error: "Password is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const account = await db.collection("customerAccounts").findOne({ email });
    if (!account?.passwordHash) {
      return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    const match = await bcrypt.compare(password, account.passwordHash);
    if (!match) {
      return Response.json({ success: false, error: "Invalid email or password." }, { status: 401 });
    }

    await db.collection("customerAccounts").updateOne(
      { _id: account._id },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date(), authMethod: "email" } }
    );

    const token = signCustomerToken({
      id: String(account._id),
      phone: account.phone ?? "",
      email: account.email ?? "",
      name: account.name ?? "",
    });
    const res = Response.json({
      success: true,
      user: serializeCustomerUser(account),
    });
    return setCustomerTokenCookie(res, token, true);
  } catch (err) {
    console.error("customer.auth.login-email failed:", err.message);
    return Response.json({ success: false, error: "Login failed." }, { status: 500 });
  }
}
