import { buildFromAddress, createSmtpTransport } from "@/lib/emailService";
import { withTenant } from "@/lib/tenantDb";

const SECRET_MASK = "********";

/**
 * POST /api/settings/test-email
 * Uses incoming SMTP snapshot; falls back to stored password when client sends mask/empty.
 * Body: { smtp?: object, testRecipient?: string }
 */
export const POST = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  let body = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
  }

  const smtpInput = body.smtp;
  if (!smtpInput?.smtpHost || !smtpInput?.smtpUser) {
    return Response.json(
      { success: false, error: "SMTP Host and Username are required." },
      { status: 400 }
    );
  }

  const stored = await db
    .collection("restaurant_settings")
    .findOne({ restaurantId }, { projection: { email: 1 } });

  let password = String(smtpInput.smtpPassword ?? "");
  if (!password || password === SECRET_MASK) {
    password = String(stored?.email?.smtpPassword ?? "");
  }

  const effective = {
    ...smtpInput,
    smtpPassword: password,
  };

  try {
    const transport = createSmtpTransport(effective);
    const to =
      typeof body.testRecipient === "string" && body.testRecipient.trim()
        ? body.testRecipient.trim()
        : smtpInput.smtpUser;

    await transport.sendMail({
      from: buildFromAddress(effective),
      to,
      subject: "Restaurant — SMTP test",
      text: `This is a test message from your restaurant settings (tenant SMTP). Sent at ${new Date().toISOString()}`,
      html: `<p>This is a test message from your <strong>restaurant</strong> Email / SMTP settings.</p>`,
    });

    return Response.json({ success: true, message: "Test email sent." });
  } catch (err) {
    console.error("Tenant SMTP test error:", err.message);
    return Response.json(
      {
        success: false,
        error: err.message || "Failed to send test email. Check SMTP settings.",
      },
      { status: 500 }
    );
  }
});
