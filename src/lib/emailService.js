import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";
import {
  normalizeSmtpHost,
  normalizeSmtpSecure,
} from "@/lib/smtpConfig";

export {
  SMTP_SECRET_MASK,
  buildEffectiveSmtpConfig,
  detectBrevoSmtpIssues,
  formatSmtpError,
  isSmtpPasswordMask,
  maskSmtpSettingsForClient,
  mergeSmtpPasswordForSave,
  normalizeSmtpHost,
  normalizeSmtpSecure,
  sanitizeSmtpSettings,
} from "@/lib/smtpConfig";

const EMAIL_FROM_NAME = BHOJDESK_BRAND.name;
const EMAIL_PRODUCT_NAME = BHOJDESK_BRAND.fullName;

/** Custom SMTP shape (tenant / platform settings); same fields as nodemailer transport options auth. */
export function createSmtpTransport(smtp) {
  if (!smtp?.smtpHost || !smtp?.smtpUser) {
    throw new Error("SMTP Host and Username are required.");
  }
  const smtpHost = normalizeSmtpHost(smtp.smtpHost);
  if (!smtpHost) {
    throw new Error("SMTP Host is required.");
  }
  const port = Number(smtp.smtpPort ?? 587);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("Invalid SMTP port.");
  }
  if (!String(smtp.smtpPassword ?? "").trim()) {
    throw new Error("SMTP password is required.");
  }
  const secure = normalizeSmtpSecure(port, smtp.secure);
  return nodemailer.createTransport({
    host: smtpHost,
    port,
    secure,
    auth: {
      user: smtp.smtpUser,
      pass: String(smtp.smtpPassword ?? ""),
    },
  });
}

/** Build a MIME "from" string from tenant email settings */
export function buildFromAddress(smtp) {
  const name = String(smtp.fromName ?? "").trim() || "Restaurant";
  const addr = String(smtp.fromEmail ?? "").trim() || String(smtp.smtpUser ?? "").trim();
  return `"${name.replace(/"/g, "")}" <${addr}>`;
}

/* ── Transporter (lazy init — only created when needed) ── */
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    service: "gmail",   // let nodemailer handle Gmail config automatically
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}

function normalizeRestaurantId(restaurantId) {
  if (restaurantId == null || restaurantId === "") return null;
  if (typeof restaurantId === "string") {
    return ObjectId.isValid(restaurantId) ? new ObjectId(restaurantId) : null;
  }
  return restaurantId;
}

/** Create a nodemailer transport from `restaurant_settings.email` when enabled and complete. */
export async function getRestaurantSmtpTransport(db, restaurantId) {
  const doc = await db
    .collection("restaurant_settings")
    .findOne({ restaurantId }, { projection: { email: 1 } });

  const email = doc?.email;
  if (!email?.enabled) return null;
  if (!email.smtpHost?.trim() || !email.smtpUser?.trim() || !email.smtpPassword) {
    return null;
  }
  try {
    return createSmtpTransport(email);
  } catch {
    return null;
  }
}

/** Tenant (enabled + creds) → platform Mongo `settings.email` → env Gmail */
async function resolveMailSendingContext(db, restaurantId) {
  const rid = normalizeRestaurantId(restaurantId);
  if (rid) {
    const tTenant = await getRestaurantSmtpTransport(db, rid);
    if (tTenant) {
      const row = await db
        .collection("restaurant_settings")
        .findOne({ restaurantId: rid }, { projection: { email: 1 } });
      return {
        transporter: tTenant,
        from: buildFromAddress(row?.email ?? {}),
      };
    }
  }

  const platformDoc = await db
    .collection("settings")
    .findOne({ _id: "platform" }, { projection: { email: 1 } });
  const pe = platformDoc?.email;
  if (pe?.smtpHost?.trim() && pe?.smtpUser?.trim() && pe?.smtpPassword) {
    try {
      return {
        transporter: createSmtpTransport(pe),
        from: buildFromAddress(pe),
      };
    } catch {
      /* fall through */
    }
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const raw = process.env.EMAIL_FROM?.trim();
    return {
      transporter: getTransporter(),
      from: raw || `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    };
  }

  throw new Error("No outbound email is configured.");
}

/* ── HTML email template ── */
function buildVerificationHtml(name, url) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#10b981;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#09090b;">
                🍽️ ${EMAIL_PRODUCT_NAME}
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#f4f4f5;">
                Welcome, ${name}!
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                Thanks for signing up. Please verify your email address to activate
                your account. This link will expire in
                <strong style="color:#f4f4f5;">15 minutes</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background:#10b981;">
                    <a href="${url}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;
                             font-weight:700;color:#09090b;text-decoration:none;
                             border-radius:10px;">
                      ✅ Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:24px 0 0;font-size:12px;color:#71717a;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:6px 0 0;font-size:12px;word-break:break-all;">
                <a href="${url}" style="color:#10b981;">${url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #27272a;">
              <p style="margin:0;font-size:11px;color:#3f3f46;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetPasswordHtml(name, url) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#09090b;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
          <tr>
            <td style="background:#10b981;padding:24px 32px;">
              <p style="margin:0;font-size:20px;font-weight:700;color:#09090b;">
                🔐 ${EMAIL_FROM_NAME} Password Reset
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;color:#f4f4f5;">
                Hi ${name || "there"},
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                We received a request to reset your password. This link expires in
                <strong style="color:#f4f4f5;">15 minutes</strong>.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background:#10b981;">
                    <a href="${url}"
                      style="display:inline-block;padding:14px 32px;font-size:15px;
                             font-weight:700;color:#09090b;text-decoration:none;
                             border-radius:10px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#71717a;">
                If you did not request this, please ignore this email.
              </p>
              <p style="margin:6px 0 0;font-size:12px;word-break:break-all;">
                <a href="${url}" style="color:#10b981;">${url}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send email verification link.
 * Pass `db` + `restaurantId` so tenant SMTP (Settings → Email) or Super Admin SMTP is used before env Gmail.
 *
 * @param {{ name: string, email: string, token: string, baseUrl?: string, db?: import('mongodb').Db, restaurantId?: import('mongodb').ObjectId | string | null }} params
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendVerificationEmail({
  name,
  email,
  token,
  baseUrl,
  db,
  restaurantId,
}) {
  const appBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${appBaseUrl}/verify-email?token=${token}`;

  try {
    const { transporter, from } = db
      ? await resolveMailSendingContext(db, restaurantId ?? null)
        : (() => {
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("EMAIL_USER / EMAIL_PASS are not set.");
          }
          const raw = process.env.EMAIL_FROM?.trim();
          return {
            transporter: getTransporter(),
            from: raw || `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
          };
        })();

    await transporter.sendMail({
      from,
      to: email,
      subject: `Verify your ${EMAIL_FROM_NAME} account`,
      text: `Hi ${name}, verify your email: ${url}`,
      html: buildVerificationHtml(name, url),
    });

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (err) {
    console.error(`❌ Email send failed to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * @param {{ name: string, email: string, token: string, baseUrl?: string, db?: import('mongodb').Db, restaurantId?: import('mongodb').ObjectId | string | null }} params
 */
export async function sendPasswordResetEmail({
  name,
  email,
  token,
  baseUrl,
  db,
  restaurantId,
}) {
  const appBaseUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${appBaseUrl}/reset-password?token=${token}`;
  try {
    const { transporter, from } = db
      ? await resolveMailSendingContext(db, restaurantId ?? null)
        : (() => {
          if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            throw new Error("EMAIL_USER / EMAIL_PASS are not set.");
          }
          const raw = process.env.EMAIL_FROM?.trim();
          return {
            transporter: getTransporter(),
            from: raw || `"${EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
          };
        })();

    await transporter.sendMail({
      from,
      to: email,
      subject: `Reset your ${EMAIL_FROM_NAME} password`,
      text: `Hi ${name || ""}, reset your password here: ${url}`,
      html: buildResetPasswordHtml(name, url),
    });
    return { success: true };
  } catch (err) {
    console.error(`❌ Reset email send failed to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Test SMTP connection — call from /api/auth/test-email to verify config.
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function testEmailConnection() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/** Whether platform/tenant/env SMTP can send outbound mail. */
export async function canSendOutboundEmail(db, restaurantId = null) {
  try {
    await resolveMailSendingContext(db, restaurantId);
    return true;
  } catch {
    return false;
  }
}

function buildContactReplyHtml({ toName, body, originalSubject, originalMessage, originalFrom }) {
  const safeName = String(toName ?? "there").replace(/</g, "&lt;");
  const safeBody = String(body ?? "").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
  const safeOrig = String(originalMessage ?? "").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="background:#4f46e5;padding:20px 28px;">
              <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">${EMAIL_FROM_NAME} Support</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;color:#0f172a;line-height:1.6;">Hi ${safeName},</p>
              <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">${safeBody}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:#64748b;">Your original message</p>
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#0f172a;">${String(originalSubject ?? "Inquiry").replace(/</g, "&lt;")}</p>
                    <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">${safeOrig}</p>
                    ${originalFrom ? `<p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">From: ${String(originalFrom).replace(/</g, "&lt;")}</p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Super Admin / tenant reply to a contact inbox message. */
export async function sendContactInquiryReply({
  db,
  restaurantId = null,
  to,
  toName,
  subject,
  body,
  originalSubject,
  originalMessage,
}) {
  const recipient = String(to ?? "").trim().toLowerCase();
  const messageBody = String(body ?? "").trim();
  if (!recipient || !messageBody) {
    return { success: false, error: "Recipient and message are required." };
  }

  let replySubject = String(subject ?? "").trim();
  if (!replySubject) replySubject = `Re: ${String(originalSubject ?? "Your inquiry").trim() || "Your inquiry"}`;
  if (!/^re:/i.test(replySubject)) replySubject = `Re: ${replySubject}`;

  try {
    const { transporter, from } = await resolveMailSendingContext(db, restaurantId ?? null);
    const text = [
      `Hi ${toName || "there"},`,
      "",
      messageBody,
      "",
      "---",
      "Your original message:",
      originalSubject ? `Subject: ${originalSubject}` : "",
      originalMessage ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    await transporter.sendMail({
      from,
      to: recipient,
      subject: replySubject.slice(0, 200),
      text,
      html: buildContactReplyHtml({
        toName,
        body: messageBody,
        originalSubject,
        originalMessage,
        originalFrom: toName,
      }),
    });

    return { success: true, subject: replySubject.slice(0, 200) };
  } catch (err) {
    console.error("Contact inquiry reply failed:", err?.message);
    return {
      success: false,
      error:
        err?.message?.includes("No outbound email")
          ? "Email is not configured. Set up SMTP in Super Admin → Settings."
          : "Failed to send reply. Check SMTP settings.",
    };
  }
}

/** Notify restaurant contact email when a new order is placed. */
export async function sendNewOrderAlertEmail({ order, db, restaurantId, toEmail }) {
  const recipient = String(toEmail ?? "").trim();
  if (!recipient) return { success: false, error: "No alert email configured." };

  try {
    const { transporter, from } = await resolveMailSendingContext(db, restaurantId ?? null);
    const customer = order.customer ?? order.customerInfo?.name ?? "Customer";
    const total = Number(order.total ?? 0).toFixed(2);

    await transporter.sendMail({
      from,
      to: recipient,
      subject: `New order ${order.orderId ?? ""}`.trim(),
      text: `New ${order.orderType ?? "order"} from ${customer}. Total: ${total}. Order ID: ${order.orderId ?? "—"}.`,
      html: `<p>New <strong>${order.orderType ?? "order"}</strong> from ${customer}.</p><p>Total: <strong>${total}</strong></p><p>Order ID: ${order.orderId ?? "—"}</p>`,
    });
    return { success: true };
  } catch (err) {
    console.error("New order alert email failed:", err.message);
    return { success: false, error: err.message };
  }
}
