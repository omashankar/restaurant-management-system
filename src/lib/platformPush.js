import webpush from "web-push";
import { getPlatformSettings } from "@/lib/platformSettings";

let vapidConfigured = false;

function ensureVapid(settings) {
  const pub = String(settings.notifications?.pushVapidPublicKey ?? "").trim();
  const priv = String(settings.notifications?.pushVapidPrivateKey ?? "").trim();
  if (!pub || !priv) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      "mailto:support@rms.local",
      pub,
      priv,
    );
    vapidConfigured = true;
  }
  return true;
}

/**
 * @param {import("mongodb").Db} db
 */
export async function sendPlatformPush(db, { title, body, url = "/super-admin/dashboard" }) {
  const settings = await getPlatformSettings(db);
  if (!settings.notifications?.pushEnabled) return { sent: 0 };
  if (!ensureVapid(settings)) return { sent: 0, reason: "no_vapid" };

  const subs = await db
    .collection("push_subscriptions")
    .find({ scope: "platform" })
    .limit(200)
    .toArray();

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, payload);
      sent += 1;
    } catch (err) {
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await db.collection("push_subscriptions").deleteOne({ _id: sub._id });
      }
    }
  }
  return { sent };
}
