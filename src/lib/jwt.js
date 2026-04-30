import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET is required in production.");
}
const EFFECTIVE_SECRET = SECRET ?? "dev-only-secret";

/** Sign a JWT token */
export function signToken(payload) {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

/** Verify a JWT token — returns payload or null */
export function verifyToken(token) {
  try {
    return jwt.verify(token, EFFECTIVE_SECRET);
  } catch {
    return null;
  }
}

export function verifyTokenDetailed(token) {
  try {
    return { payload: jwt.verify(token, EFFECTIVE_SECRET), code: "ok" };
  } catch (err) {
    if (err?.name === "TokenExpiredError") return { payload: null, code: "expired" };
    return { payload: null, code: "invalid" };
  }
}
