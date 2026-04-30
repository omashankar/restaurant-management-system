/**
 * POST /api/super-admin/settings/backup
 * Trigger a manual backup. Records timestamp in DB.
 * In production you'd kick off a real backup job here.
 */
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();
    const now    = new Date();

    /* Record backup entry */
    await db.collection("backups").insertOne({
      createdAt: now,
      type:      "manual",
      status:    "completed",
      size:      "—",
    });

    /* Update last backup timestamp in settings */
    await db.collection("settings").updateOne(
      { _id: "platform" },
      { $set: { "backup.lastBackupAt": now, updatedAt: now } },
      { upsert: true }
    );

    /* Return last 10 backups */
    const backups = await db.collection("backups")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return Response.json({
      success: true,
      message: "Backup completed.",
      lastBackupAt: now,
      backups: backups.map((b) => ({
        id:        b._id.toString(),
        createdAt: b.createdAt,
        type:      b.type,
        status:    b.status,
        size:      b.size,
      })),
    });
  } catch (err) {
    console.error("POST backup error:", err.message);
    return Response.json({ success: false, error: "Backup failed." }, { status: 500 });
  }
}

/* GET — list recent backups */
export async function GET(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  try {
    const client  = await clientPromise;
    const db      = client.db();
    const backups = await db.collection("backups")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return Response.json({
      success: true,
      backups: backups.map((b) => ({
        id:        b._id.toString(),
        createdAt: b.createdAt,
        type:      b.type,
        status:    b.status,
        size:      b.size,
      })),
    });
  } catch (err) {
    console.error("GET backups error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
