import clientPromise from "@/lib/mongodb";
import { sendPlatformAlert } from "@/lib/platformAlerts";
import { getPlatformSettings } from "@/lib/platformSettings";

/**
 * GET /api/cron/weekly-report
 * Trigger with header: Authorization: Bearer <CRON_SECRET>
 * Or ?secret= for manual testing.
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return Response.json(
      { success: false, error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const querySecret = new URL(request.url).searchParams.get("secret");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : querySecret;
  if (token !== secret) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const platform = await getPlatformSettings(db);
    if (!platform.notifications?.weeklyReport) {
      return Response.json({ success: true, skipped: true, reason: "disabled" });
    }

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [restaurants, orders, payments] = await Promise.all([
      db.collection("restaurants").countDocuments({ createdAt: { $gte: weekAgo } }),
      db.collection("orders").countDocuments({ createdAt: { $gte: weekAgo } }),
      db
        .collection("orders")
        .countDocuments({ createdAt: { $gte: weekAgo }, "payment.status": "paid" }),
    ]);

    const sent = await sendPlatformAlert(db, "weeklyReport", {
      subject: "[RMS] Weekly platform report",
      text: `Weekly summary (last 7 days):\n\nNew restaurants: ${restaurants}\nOrders: ${orders}\nPaid orders: ${payments}\n\nGenerated: ${new Date().toISOString()}`,
    });

    return Response.json({ success: true, sent, stats: { restaurants, orders, payments } });
  } catch (err) {
    console.error("weekly-report cron:", err.message);
    return Response.json({ success: false, error: "Failed." }, { status: 500 });
  }
}
