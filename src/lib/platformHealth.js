import { platformEmailSubject } from "@/config/bhojdeskBrand";
import { sendPlatformAlert } from "@/lib/platformAlerts";
import { getPlatformSettings } from "@/lib/platformSettings";

/**
 * Lightweight platform health checks for cron + system alert emails.
 * @param {import("mongodb").Db} db
 */
export async function runPlatformHealthCheck(db) {
  const settings = await getPlatformSettings(db);
  const issues = [];

  try {
    await db.command({ ping: 1 });
  } catch (err) {
    issues.push(`Database unreachable: ${err.message}`);
  }

  const backup = settings.backup ?? {};
  if (backup.autoBackup) {
    const last = backup.lastBackupAt ? new Date(backup.lastBackupAt) : null;
    const retention = Math.max(1, Number(backup.retentionDays ?? 30) || 30);
    const maxAgeMs = retention * 2 * 86_400_000;
    if (!last || Number.isNaN(last.getTime()) || Date.now() - last.getTime() > maxAgeMs) {
      issues.push(
        `No recent backup (auto-backup is on; last: ${
          last && !Number.isNaN(last.getTime()) ? last.toISOString() : "never"
        }).`,
      );
    }
  }

  const failedBackups = await db.collection("backups").countDocuments({
    status: { $ne: "completed" },
    createdAt: { $gte: new Date(Date.now() - 24 * 86_400_000) },
  });
  if (failedBackups > 0) {
    issues.push(`${failedBackups} backup job(s) failed in the last 24 hours.`);
  }

  const recentSystemLogs = await db.collection("audit_logs").countDocuments({
    category: "system",
    createdAt: { $gte: new Date(Date.now() - 60 * 60_000) },
    action: { $regex: /(fail|error|backup)/i },
  }).catch(() => 0);
  if (recentSystemLogs > 10) {
    issues.push(`${recentSystemLogs} system failure events logged in the last hour.`);
  }

  let alertSent = false;
  if (issues.length > 0) {
    alertSent = await sendPlatformAlert(db, "systemHealth", {
      subject: platformEmailSubject(`System health: ${issues.length} issue(s)`),
      text: `Platform health check found:\n\n${issues.map((i) => `• ${i}`).join("\n")}`,
      html: `<p>Platform health check found:</p><ul>${issues.map((i) => `<li>${i}</li>`).join("")}</ul>`,
    });
  }

  return { ok: issues.length === 0, issues, alertSent };
}
