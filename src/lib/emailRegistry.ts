import type { Db } from "mongodb";

export const DUPLICATE_EMAIL_MESSAGE = "Email already registered.";

export function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

/**
 * Find an existing user by email (case-insensitive).
 */
export async function findRegisteredUserByEmail(db: Db, email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return db.collection("users").findOne({ email: normalized });
}

/**
 * Throws when email is already registered.
 */
export async function assertEmailNotRegistered(
  db: Db,
  email: string,
): Promise<void> {
  const existing = await findRegisteredUserByEmail(db, email);
  if (existing) {
    const err = new Error("EMAIL_EXISTS");
    err.name = "EmailRegistryError";
    throw err;
  }
}

export function duplicateEmailResponse() {
  return Response.json(
    { success: false, error: DUPLICATE_EMAIL_MESSAGE },
    { status: 409 },
  );
}
