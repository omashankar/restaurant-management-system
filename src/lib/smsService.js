import { getPlatformSettings } from "@/lib/platformSettings";

/**
 * Send SMS via platform Super Admin → SMS settings.
 * @param {import("mongodb").Db} [db]
 */
export async function sendPlatformSms(db, phone, message) {
  const settings = await getPlatformSettings(db);
  const sms = settings.sms ?? {};
  if (!sms.enabled) return { sent: false, reason: "disabled" };

  const to = String(phone ?? "").replace(/\D/g, "");
  if (!to || to.length < 10) {
    return { sent: false, reason: "invalid_phone" };
  }

  const provider = String(sms.provider ?? "twilio").toLowerCase();
  const text = String(message ?? "").trim();
  if (!text) return { sent: false, reason: "empty_message" };

  if (provider === "twilio") {
    const sid = String(sms.apiKey ?? "").trim();
    const token = String(sms.authToken ?? "").trim();
    const from = String(sms.senderId ?? "").trim();
    if (!sid || !token || !from) {
      return { sent: false, reason: "missing_twilio_config" };
    }
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const body = new URLSearchParams({
      To: to.startsWith("+") ? to : `+91${to.slice(-10)}`,
      From: from,
      Body: text,
    });
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Twilio SMS failed:", res.status, errText.slice(0, 200));
      return { sent: false, reason: "twilio_error" };
    }
    return { sent: true };
  }

  if (provider === "fast2sms") {
    const apiKey = String(sms.apiKey ?? "").trim();
    if (!apiKey) return { sent: false, reason: "missing_fast2sms_key" };
    const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",
        message: text,
        language: "english",
        numbers: to.slice(-10),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.return !== true) {
      console.error("Fast2SMS failed:", data);
      return { sent: false, reason: "fast2sms_error" };
    }
    return { sent: true };
  }

  return { sent: false, reason: "unknown_provider" };
}
