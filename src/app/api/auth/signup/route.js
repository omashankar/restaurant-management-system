import { getClientIp, signupLimiter } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/emailService";
import { logError, logInfo } from "@/lib/logger";
import clientPromise from "@/lib/mongodb";

export async function POST(request) {
  /* ── Rate limit ── */
  const ip = getClientIp(request);
  const limit = await signupLimiter.check(ip);
  if (!limit.allowed) {
    return Response.json(
      { success: false, error: `Too many signup attempts. Try again in ${limit.retryAfter}s.` },
      { status: 429 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, phone, password, restaurantName } = body ?? {};
  const role = "admin";

  /* ── Manual validation (no Zod dependency issues) ── */
  if (!name?.trim())     return Response.json({ success: false, error: "Name is required." },     { status: 400 });
  if (!email?.trim())    return Response.json({ success: false, error: "Email is required." },    { status: 400 });
  if (!password)         return Response.json({ success: false, error: "Password is required." }, { status: 400 });
  if (password.length < 6) return Response.json({ success: false, error: "Password must be at least 6 characters." }, { status: 400 });
  const cleanEmail          = email.toLowerCase().trim();
  const cleanPhone          = String(phone ?? "").trim();
  const cleanRestaurantName = restaurantName?.trim() || null;

  if (!cleanRestaurantName) {
    return Response.json({ success: false, error: "Restaurant name is required." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    /* ── Duplicate email check ── */
    const existing = await db.collection("users").findOne({ email: cleanEmail });
    if (existing) {
      return Response.json({ success: false, error: "Email already registered." }, { status: 409 });
    }

    /* ── Create restaurant for admin ── */
    const resResult = await db.collection("restaurants").insertOne({
      name: cleanRestaurantName,
      ownerId: null,
      createdAt: new Date(),
    });
    const restaurantId = resResult.insertedId;

    /* ── Hash password & insert user ── */
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    const isSuperAdmin = role === "super_admin";

    const result = await db.collection("users").insertOne({
      name: name.trim(),
      email: cleanEmail,
      phone: cleanPhone || null,
      password: hashedPassword,
      role,
      restaurantId,
      isVerified: isSuperAdmin,
      emailVerificationToken: isSuperAdmin ? null : verificationToken,
      emailVerificationExpires: isSuperAdmin ? null : verificationExpires,
      status: "active",
      createdAt: new Date(),
    });

    /* ── Link restaurant owner ── */
    await db.collection("restaurants").updateOne(
      { _id: restaurantId },
      { $set: { ownerId: result.insertedId } }
    );

    if (!isSuperAdmin) {
      sendVerificationEmail({
        name: name.trim(),
        email: cleanEmail,
        token: verificationToken,
      }).catch((err) => {
        console.error("Signup verification email failed:", err.message);
      });
    }

    logInfo("auth.signup.success", { email: cleanEmail, role });
    return Response.json({
      success: true,
      requiresVerification: !isSuperAdmin,
      message: isSuperAdmin
        ? "Account created successfully."
        : "Account created. Please verify your email before logging in.",
    });

  } catch (err) {
    logError("auth.signup.failed", err, { route: "/api/auth/signup" });
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
