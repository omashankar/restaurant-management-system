import clientPromise from "@/lib/mongodb";
import { verifyCronSecret } from "@/lib/cronAuth";
import { runPlatformBackup, isBackupDue } from "@/lib/platformBackup";
import { runPlatformAutoBilling } from "@/lib/platformAutoBilling";
import { getPlatformSettings } from "@/lib/platformSettings";
import { sendPlatformAlert } from "@/lib/platformAlerts";

/**
 * GET /api/cron/platform-tasks
 * Runs: auto-backup (if due), weekly report (Mondays), auto-billing.
 * Authorization: Bearer CRON_SECRET
 */
export async function GET(request) {
  const auth = verifyCronSecret(request);
  if (!auth.ok) {
    return Response.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const settings = await getPlatformSettings(db);
    const results = {};

    if (isBackupDue(settings.backup)) {
      results.backup = await runPlatformBackup(db, "scheduled");
    } else {
      results.backup = { skipped: true };
    }

    const day = new Date().getUTCDay();
    if (day === 1 && settings.notifications?.weeklyReport) {
      const weekAgo = new Date(Date.now() - 7 * 86_400_000);
      const [restaurants, orders, payments] = await Promise.all([
        db.collection("restaurants").countDocuments({ createdAt: { $gte: weekAgo } }),
        db.collection("orders").countDocuments({ createdAt: { $gte: weekAgo } }),
        db.collection("orders").countDocuments({
          createdAt: { $gte: weekAgo },
          "payment.status": "paid",
        }),
      ]);
      const sent = await sendPlatformAlert(db, "weeklyReport", {
        subject: "[RMS] Weekly platform report",
        text: `Weekly summary:\nNew restaurants: ${restaurants}\nOrders: ${orders}\nPaid orders: ${payments}`,
      });
      results.weeklyReport = { sent, restaurants, orders, payments };
    } else {
      results.weeklyReport = { skipped: true };
    }

    results.autoBilling = await runPlatformAutoBilling(db);

    return Response.json({ success: true, results });
  } catch (err) {
    console.error("platform-tasks cron:", err.message);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
