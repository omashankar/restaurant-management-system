/**
 * POST /api/super-admin/settings/test-email
 * Send a test email using the provided SMTP config.
 * Uses nodemailer (already installed).
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import nodemailer from "nodemailer";

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

  try {
    const transporter = nodemailer.createTransport({
      host:   smtp.smtpHost,
      port:   Number(smtp.smtpPort ?? 587),
      secure: !!smtp.secure,
      auth: {
        user: smtp.smtpUser,
        pass: smtp.smtpPassword ?? "",
      },
    });

    await transporter.sendMail({
      from:    `"${smtp.fromName ?? "RMS Platform"}" <${smtp.fromEmail || smtp.smtpUser}>`,
      to:      smtp.smtpUser,
      subject: "RMS — SMTP Test Email",
      text:    "This is a test email from your RMS Super Admin panel. Your SMTP configuration is working correctly.",
      html:    `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#10b981;margin-bottom:8px">SMTP Test Successful ✓</h2>
          <p style="color:#71717a;font-size:14px">
            This is a test email from your <strong>RMS Super Admin</strong> panel.
            Your SMTP configuration is working correctly.
          </p>
          <hr style="border:none;border-top:1px solid #27272a;margin:20px 0"/>
          <p style="color:#52525b;font-size:12px">Sent from RMS Platform · Super Admin Settings</p>
        </div>
      `,
    });

    return Response.json({ success: true, message: "Test email sent." });
  } catch (err) {
    console.error("Test email error:", err.message);
    return Response.json(
      { success: false, error: `SMTP error: ${err.message}` },
      { status: 500 }
    );
  }
}
