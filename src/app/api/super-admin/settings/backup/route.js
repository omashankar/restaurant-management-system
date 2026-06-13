/**
 * POST /api/super-admin/settings/backup
 * Trigger a manual backup. Records timestamp in DB.
 * In production you'd kick off a real backup job here.
 */
import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { sendPlatformAlert } from "@/lib/platformAlerts";
import { runPlatformBackup } from "@/lib/platformBackup";
import { invalidatePlatformSettingsCache } from "@/lib/platformSettings";
import { getClientIp } from "@/lib/rateLimit";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function POST(request) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    await runPlatformBackup(db, "manual");
    invalidatePlatformSettingsCache();

    const backups = await db.collection("backups")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    await writeAuditLog({
      action: "system.backup",
      category: "system",
      actorId: sa.id,
      ip: getClientIp(request),
    });

    const settings = await db.collection("settings").findOne({ _id: "platform" });

    return Response.json({
      success: true,
      message: "Backup completed.",
      lastBackupAt: settings?.backup?.lastBackupAt ?? new Date(),
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
    try {
      const client = await clientPromise;
      await sendPlatformAlert(client.db(), "systemHealth", {
        subject: "[BhojDesk RMS] Manual backup failed",
        text: `A manual platform backup failed:\n\n${err.message}`,
      });
    } catch {
      /* ignore */
    }
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
