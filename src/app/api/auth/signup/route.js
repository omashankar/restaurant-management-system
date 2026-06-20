import { platformEmailSubject } from "@/config/bhojdeskBrand";
import { getClientIp, signupLimiter } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail } from "@/lib/emailService";
import { logError, logInfo } from "@/lib/logger";
import clientPromise from "@/lib/mongodb";
import {
  assertEmailNotRegistered,
  DUPLICATE_EMAIL_MESSAGE,
} from "@/lib/emailRegistry";
import { getPlatformSettings } from "@/lib/platformSettings";
import { validatePlatformPassword } from "@/lib/platformPassword";
import { notifyPlatformEvent } from "@/lib/platformNotify";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { assertRealEmail, realEmailErrorResponse } from "@/lib/realEmailValidation";
import { parseSchema, signupSchema } from "@/lib/validationSchemas";

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

  const role = "admin";
  const cleanSlug = String(body?.slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").trim();

  let validated;
  try {
    validated = parseSchema(signupSchema, { ...body, slug: cleanSlug });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  const {
    name,
    email: cleanEmail,
    phone,
    password,
    restaurantName: cleanRestaurantName,
    slug: validatedSlug,
  } = validated;
  const cleanPhone = phone ? extractIndianMobileDigits(phone) : "";

  try {
    await assertRealEmail(cleanEmail);
  } catch (err) {
    const res = realEmailErrorResponse(err);
    if (res) return res;
    throw err;
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    const platform = await getPlatformSettings(db);
    const pwdCheck = validatePlatformPassword(password, platform.security ?? {});
    if (!pwdCheck.valid) {
      return Response.json({ success: false, error: pwdCheck.error }, { status: 400 });
    }

    /* ── Duplicate email check ── */
    try {
      await assertEmailNotRegistered(db, cleanEmail);
    } catch (err) {
      if (err.message === "EMAIL_EXISTS") {
        return Response.json(
          { success: false, error: DUPLICATE_EMAIL_MESSAGE },
          { status: 409 },
        );
      }
      throw err;
    }

    /* ── Duplicate slug check ── */
    const existingSlug = await db.collection("restaurants").findOne({ slug: validatedSlug });
    if (existingSlug) {
      return Response.json({ success: false, error: "Yeh customer URL (slug) pehle se use ho raha hai. Koi aur slug choose karein." }, { status: 409 });
    }

    /* ── Create restaurant for admin ── */
    const resResult = await db.collection("restaurants").insertOne({
      name: cleanRestaurantName,
      slug: validatedSlug,
      ownerId: null,
      status: "active",
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
      status: isSuperAdmin ? "active" : "pending",
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
        db,
        restaurantId,
      }).catch((err) => {
        console.error("Signup verification email failed:", err.message);
      });
    }

    notifyPlatformEvent(db, {
      event: "restaurant.signup",
      webhookData: { restaurantName: cleanRestaurantName, slug: validatedSlug, email: cleanEmail },
      pushTitle: "New restaurant signup",
      pushBody: cleanRestaurantName,
      emailType: "newRestaurant",
      emailContent: {
        subject: platformEmailSubject(`New restaurant signup: ${cleanRestaurantName}`),
        text: `A new restaurant registered.\n\n${cleanRestaurantName}\nSlug: ${validatedSlug}\nOwner: ${cleanEmail}`,
      },
    }).catch(() => {});

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
