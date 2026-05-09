import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";

/** Custom SMTP shape (tenant / platform settings); same fields as nodemailer transport options auth. */
export function createSmtpTransport(smtp) {
  if (!smtp?.smtpHost || !smtp?.smtpUser) {
    throw new Error("SMTP Host and Username are required.");
  }
  const port = Number(smtp.smtpPort ?? 587);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("Invalid SMTP port.");
  }
  return nodemailer.createTransport({
    host: smtp.smtpHost,
    port,
    secure: Boolean(smtp.secure),
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
      from: raw || `"RMS" <${process.env.EMAIL_USER}>`,
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
                🍽️ Restaurant Management System
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
                🔐 RMS Password Reset
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
            from: raw || `"RMS" <${process.env.EMAIL_USER}>`,
          };
        })();

    await transporter.sendMail({
      from,
      to: email,
      subject: "Verify your RMS account",
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
            from: raw || `"RMS" <${process.env.EMAIL_USER}>`,
          };
        })();

    await transporter.sendMail({
      from,
      to: email,
      subject: "Reset your RMS password",
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
