/**
 * GET  /api/payment-settings/gateway-health  — get health status of all enabled gateways
 * POST /api/payment-settings/gateway-health  — record a health event (called internally)
 */
import { withTenant } from "@/lib/tenantDb";

export const GET = withTenant(["admin", "manager"], async ({ db, restaurantId }) => {
  const [settingsDoc, healthLogs] = await Promise.all([
    db.collection("restaurant_payment_settings").findOne({ restaurantId }),
    db.collection("gateway_health_logs")
      .find({ restaurantId })
      .sort({ checkedAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  const gateways = settingsDoc?.gateways ?? {};
  const health = {};

  for (const [gwId, gwConfig] of Object.entries(gateways)) {
    if (!gwConfig?.enabled) continue;
    // Get latest log for this gateway
    const latest = healthLogs.find((l) => l.gateway === gwId);
    const recentLogs = healthLogs.filter((l) => l.gateway === gwId).slice(0, 10);
    const successCount = recentLogs.filter((l) => l.status === "healthy").length;
    const uptime = recentLogs.length > 0 ? Math.round((successCount / recentLogs.length) * 100) : null;

    health[gwId] = {
      gateway: gwId,
      enabled: true,
      testMode: Boolean(gwConfig.testMode),
      status: latest?.status ?? "unknown",
      lastChecked: latest?.checkedAt ?? null,
      uptime,
      failCount: recentLogs.filter((l) => l.status === "unhealthy").length,
      latencyMs: latest?.latencyMs ?? null,
    };
  }

  return Response.json({ success: true, health });
});

export const POST = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const { gateway, status, latencyMs, error } = body;

  if (!gateway || !["healthy", "unhealthy"].includes(status)) {
    return Response.json({ success: false, error: "gateway and status are required." }, { status: 400 });
  }

  await db.collection("gateway_health_logs").insertOne({
    restaurantId,
    gateway,
    status,
    latencyMs: Number(latencyMs) || null,
    error: error ?? null,
    checkedAt: new Date(),
  });

  return Response.json({ success: true });
});
