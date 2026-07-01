import {
  buildEffectiveSmtpConfig,
  buildFromAddress,
  createSmtpTransport,
  formatSmtpError,
} from "@/lib/emailService";
import { withTenant } from "@/lib/tenantDb";

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
  const stored = await db
    .collection("restaurant_settings")
    .findOne({ restaurantId }, { projection: { email: 1 } });

  const resolved = buildEffectiveSmtpConfig(smtpInput, stored?.email);
  if (!resolved.ok) {
    return Response.json({ success: false, error: resolved.error }, { status: resolved.status });
  }
  const effective = resolved.effective;

  try {
    const transport = createSmtpTransport(effective);
    const to =
      typeof body.testRecipient === "string" && body.testRecipient.trim()
        ? body.testRecipient.trim()
        : effective.smtpUser;

    await transport.sendMail({
      from: buildFromAddress(effective),
      to,
      subject: "Restaurant — SMTP test",
      text: `This is a test message from your restaurant settings (tenant SMTP). Sent at ${new Date().toISOString()}`,
      html: `<p>This is a test message from your <strong>restaurant</strong> Email / SMTP settings.</p>`,
    });

    return Response.json({ success: true, message: "Test email sent.", to });
  } catch (err) {
    console.error("Tenant SMTP test error:", err.message);
    return Response.json(
      {
        success: false,
        error: formatSmtpError(err, effective.smtpHost),
      },
      { status: 500 }
    );
  }
});
