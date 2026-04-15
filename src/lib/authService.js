import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb";

async function getDb() {
  const client = await clientPromise;
  return client.db();
}

/* ── Signup ── */
export async function createUser({ name, email, password, role, restaurantName }) {
  const db = await getDb();

  // Duplicate email check
  const existing = await db.collection("users").findOne({ email });
  if (existing) throw new Error("EMAIL_EXISTS");

  const hashedPassword = await bcrypt.hash(password, 10);
  let restaurantId = null;

  // Admin creates a new restaurant
  if (role === "admin") {
    if (!restaurantName?.trim()) throw new Error("RESTAURANT_NAME_REQUIRED");
    const res = await db.collection("restaurants").insertOne({
      name: restaurantName.trim(),
      ownerId: null, // will update after user insert
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
    createdAt: new Date(),
  });

  // Link restaurant owner
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

/* ── Login ── */
export async function verifyUser({ email, password }) {
  const db = await getDb();

  const user = await db.collection("users").findOne({
    email: email.toLowerCase().trim(),
  });
  if (!user) throw new Error("USER_NOT_FOUND");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("WRONG_PASSWORD");

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId?.toString() ?? null,
  };
}

/* ── Get user by ID ── */
export async function getUserById(id) {
  const db = await getDb();
  const user = await db.collection("users").findOne({ _id: new ObjectId(id) });
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    restaurantId: user.restaurantId?.toString() ?? null,
  };
}
