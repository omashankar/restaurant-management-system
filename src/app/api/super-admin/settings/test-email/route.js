/**
 * POST /api/super-admin/settings/test-email
 * Send a test email using the provided SMTP config.
 * Uses nodemailer (already installed).
 */

import { BHOJDESK_BRAND, platformEmailSubject } from "@/config/bhojdeskBrand";
import { createSmtpTransport, buildFromAddress } from "@/lib/emailService";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";

const SECRET_MASK = "********";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function POST(request) {
  const payload = superAdminOnly(request);
  if (!payload) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { smtp } = body;
  if (!smtp?.smtpHost || !smtp?.smtpUser) {
    return Response.json(
      { success: false, error: "SMTP Host and Username are required." },
      { status: 400 }
    );
  }
  const port = Number(smtp.smtpPort ?? 587);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    return Response.json({ success: false, error: "Invalid SMTP port." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    const stored = await db.collection("settings").findOne(
      { _id: "platform" },
      { projection: { email: 1 } },
    );

    let password = String(smtp.smtpPassword ?? "");
    if (!password || password === SECRET_MASK) {
      password = String(stored?.email?.smtpPassword ?? "");
    }

    const effective = { ...smtp, smtpPassword: password };
    const transporter = createSmtpTransport(effective);

    await transporter.sendMail({
      from: buildFromAddress(effective),
      to: smtp.smtpUser,
      subject: platformEmailSubject("SMTP Test Email"),
      text:    `This is a test email from your ${BHOJDESK_BRAND.name} Super Admin panel. Your SMTP configuration is working correctly.`,
      html:    `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#10b981;margin-bottom:8px">SMTP Test Successful ✓</h2>
          <p style="color:#71717a;font-size:14px">
            This is a test email from your <strong>${BHOJDESK_BRAND.name} Super Admin</strong> panel.
            Your SMTP configuration is working correctly.
          </p>
          <hr style="border:none;border-top:1px solid #27272a;margin:20px 0"/>
          <p style="color:#52525b;font-size:12px">Sent from ${BHOJDESK_BRAND.fullName} · Super Admin Settings</p>
        </div>
      `,
    });

    return Response.json({ success: true, message: "Test email sent." });
  } catch (err) {
    console.error("Test email error:", err.message);
    return Response.json({ success: false, error: "Failed to send test email. Check SMTP settings." }, { status: 500 });
  }
}
