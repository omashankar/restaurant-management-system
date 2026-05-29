import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

const VALID_CATEGORIES = ["restaurant", "user", "payment", "settings", "auth", "system", "billing"];

/**
 * Persist an audit log entry. Never throws — logging must not break the caller.
 */
export async function writeAuditLog({
  action,
  category,
  actorId,
  actorName,
  targetId,
  targetName,
  meta,
  ip,
}) {
  if (!action || !category || !VALID_CATEGORIES.includes(category)) return;

  try {
    const client = await clientPromise;
    const db = client.db();

    let resolvedName = actorName ?? null;
    const aid = actorId ?? "system";
    if (!resolvedName && aid && aid !== "system") {
      try {
        const user = await db.collection("users").findOne(
          { _id: new ObjectId(aid) },
          { projection: { name: 1, email: 1 } },
        );
        resolvedName = user?.name ?? user?.email ?? "Super Admin";
      } catch {
        resolvedName = "Super Admin";
      }
    }

    await db.collection("audit_logs").insertOne({
      action,
      category,
      actorId: aid,
      actorName: resolvedName ?? "System",
      targetId: targetId ?? null,
      targetName: targetName ?? null,
      meta: meta ?? {},
      ip: ip ?? "unknown",
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("writeAuditLog failed:", err.message);
  }
}
