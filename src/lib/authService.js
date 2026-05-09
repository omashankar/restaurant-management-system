import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

/** Generate a secure random token */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

/* ══════════════════════════════════════
   SIGNUP — saves user, returns token
══════════════════════════════════════ */
export async function createUser({ name, email, password, role, restaurantName }) {
  const db = await getDb();

  const existing = await db.collection("users").findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new Error("EMAIL_EXISTS");

  const hashedPassword = await bcrypt.hash(password, 10);
  let restaurantId = null;

  if (role === "admin") {
    if (!restaurantName?.trim()) throw new Error("RESTAURANT_NAME_REQUIRED");
    const res = await db.collection("restaurants").insertOne({
      name: restaurantName.trim(),
      ownerId: null,
      createdAt: new Date(),
    });
    restaurantId = res.insertedId;
  }

  const result = await db.collection("users").insertOne({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role,
    restaurantId,
    isVerified: true,
    createdAt: new Date(),
  });

  if (role === "admin" && restaurantId) {
    await db.collection("restaurants").updateOne(
      { _id: restaurantId },
      { $set: { ownerId: result.insertedId } }
    );
  }

  return {
    id: result.insertedId.toString(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role,
    restaurantId: restaurantId?.toString() ?? null,
  };
}

/* ══════════════════════════════════════
   RESEND VERIFICATION EMAIL
══════════════════════════════════════ */
export async function resendVerification(email) {
  const db = await getDb();

  const user = await db.collection("users").findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.isVerified) throw new Error("ALREADY_VERIFIED");

  // Generate new token — invalidates old one
  const verificationToken = generateToken();
  const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      },
    }
  );

  return {
    name: user.name,
    email: user.email,
    verificationToken,
    restaurantId: user.restaurantId ?? null,
  };
}
export async function verifyEmail(token) {
  const db = await getDb();

  const user = await db.collection("users").findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });

  if (!user) throw new Error("TOKEN_INVALID_OR_EXPIRED");

  await db.collection("users").updateOne(
    { _id: user._id },
    {
      $set: { isVerified: true },
      $unset: { emailVerificationToken: "", emailVerificationExpires: "" },
    }
  );

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId?.toString() ?? null,
  };
}

/* ══════════════════════════════════════
   LOGIN — checks isVerified
══════════════════════════════════════ */
export async function verifyUser({ email, password }) {
  const db = await getDb();

  const user = await db.collection("users").findOne({
    email: email.toLowerCase().trim(),
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("WRONG_PASSWORD");

  if (!user.isVerified) throw new Error("EMAIL_NOT_VERIFIED");

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId?.toString() ?? null,
  };
}

/* ══════════════════════════════════════
   GET USER BY ID
══════════════════════════════════════ */
export async function getUserById(id) {
  const db = await getDb();
  let _id;
  try { _id = new ObjectId(id); } catch { return null; }
  const user = await db.collection("users").findOne({ _id });
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId?.toString() ?? null,
    isVerified: user.isVerified,
  };
}
