import { buildFromAddress, createSmtpTransport } from "@/lib/emailService";
import { getPlatformSettings } from "@/lib/platformSettings";

async function getPlatformMailer(db) {
  const settings = await getPlatformSettings(db);
  const email = settings.email ?? {};
  if (!email.smtpHost?.trim() || !email.smtpUser?.trim() || !email.smtpPassword) {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const nodemailer = await import("nodemailer");
      return {
        transporter: nodemailer.default.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        }),
        from: process.env.EMAIL_FROM || `"BhojDesk" <${process.env.EMAIL_USER}>`,
      };
    }
    return null;
  }
  return {
    transporter: createSmtpTransport(email),
    from: buildFromAddress(email),
  };
}

function resolveAlertRecipient(settings) {
  return (
    String(settings.app?.supportEmail ?? "").trim() ||
    String(settings.email?.fromEmail ?? "").trim() ||
    String(settings.email?.smtpUser ?? "").trim() ||
    ""
  );
}

/**
 * @param {import("mongodb").Db} db
 * @param {"newRestaurant"|"paymentFailed"|"weeklyReport"} type
 * @param {{ subject: string, text: string, html?: string }} content
 */
export async function sendPlatformAlert(db, type, content) {
  const settings = await getPlatformSettings(db);
  const notif = settings.notifications ?? {};

  if (type === "newRestaurant" && !notif.newRestaurantAlert) return false;
  if (type === "paymentFailed" && !notif.paymentFailAlert) return false;
  if (type === "weeklyReport" && !notif.weeklyReport) return false;
  if (!notif.systemAlerts && type !== "weeklyReport") return false;

  const to = resolveAlertRecipient(settings);
  if (!to) return false;

  const mailer = await getPlatformMailer(db);
  if (!mailer) return false;

  try {
    await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      subject: content.subject,
      text: content.text,
      html: content.html ?? content.text.replace(/\n/g, "<br/>"),
    });
    return true;
  } catch (err) {
    console.error("platform alert email failed:", err.message);
    return false;
  }
}
