import { sendPlatformAlert } from "@/lib/platformAlerts";
import { firePlatformWebhook } from "@/lib/platformWebhook";
import { sendPlatformPush } from "@/lib/platformPush";

/**
 * Fan-out platform event to webhook, push, and optional email type.
 */
export async function notifyPlatformEvent(db, {
  event,
  webhookData = {},
  pushTitle,
  pushBody,
  emailType,
  emailContent,
}) {
  const results = {};

  results.webhook = await firePlatformWebhook(db, event, webhookData);

  if (pushTitle) {
    results.push = await sendPlatformPush(db, {
      title: pushTitle,
      body: pushBody ?? "",
      url: "/super-admin/dashboard",
    });
  }

  if (emailType && emailContent) {
    results.email = await sendPlatformAlert(db, emailType, emailContent);
  }

  return results;
}
