import crypto from "node:crypto";
import { getPlatformSettings } from "@/lib/platformSettings";

/**
 * POST platform webhook when URL configured.
 * @param {import("mongodb").Db} db
 * @param {string} event
 * @param {object} data
 */
export async function firePlatformWebhook(db, event, data = {}) {
  const settings = await getPlatformSettings(db);
  const url = String(settings.integrations?.webhookUrl ?? "").trim();
  if (!url) return { sent: false, reason: "no_url" };

  const secret = String(settings.integrations?.webhookSecret ?? "").trim();
  const body = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  const headers = { "Content-Type": "application/json" };
  if (secret) {
    const sig = crypto.createHmac("sha256", secret).update(body).digest("hex");
    headers["X-RMS-Signature"] = `sha256=${sig}`;
  }

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    return { sent: res.ok, status: res.status };
  } catch (err) {
    console.error("platform webhook failed:", err.message);
    return { sent: false, reason: err.message };
  }
}
