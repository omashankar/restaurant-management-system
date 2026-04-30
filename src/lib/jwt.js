import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production.");
}
const EFFECTIVE_SECRET = SECRET ?? "dev-only-secret";

/** Sign a JWT token */
export function signToken(payload) {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: EXPIRES_IN });
}

/** Verify a JWT token — returns payload or null */
export function verifyToken(token) {
  try {
    return jwt.verify(token, EFFECTIVE_SECRET);
  } catch {
    return null;
  }
}
