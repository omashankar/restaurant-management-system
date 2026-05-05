import clientPromise from "@/lib/mongodb";
import { signupLimiter, getClientIp } from "@/lib/rateLimit";
import { setCustomerTokenCookie, signCustomerToken } from "@/lib/customerAuth";
import bcrypt from "bcryptjs";

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = await signupLimiter.check(`customer-signup:${ip}`);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phoneRaw = String(body?.phone ?? "").trim().replace(/\s|-/g, "");
  const phone = /^\+?[0-9]{8,15}$/.test(phoneRaw) ? phoneRaw : "";
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!name || !email || !password) {
    return Response.json({ success: false, error: "Name, email and password are required." }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    const dupQuery = phone ? { $or: [{ email }, { phone }] } : { email };
    const existing = await db.collection("customerAccounts").findOne(dupQuery);
    if (existing) {
      return Response.json({ success: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const doc = {
      name,
      ...(phone ? { phone } : {}),
      email,
      passwordHash,
      authMethod: "email",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };
    const result = await db.collection("customerAccounts").insertOne(doc);

    const token = signCustomerToken({
      id: String(result.insertedId),
      phone: phone || "",
      email,
      name,
    });
    const res = Response.json({
      success: true,
      user: { id: String(result.insertedId), name, phone: phone || "", email },
    });
    return setCustomerTokenCookie(res, token, true);
  } catch (err) {
    console.error("customer.auth.signup-email failed:", err.message);
    return Response.json({ success: false, error: "Signup failed." }, { status: 500 });
  }
}
