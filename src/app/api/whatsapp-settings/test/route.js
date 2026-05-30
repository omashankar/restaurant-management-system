/**
 * POST /api/whatsapp-settings/test
 * Send a real test WhatsApp message using stored credentials.
 */
import { validateWhatsappTestPhone } from "@/lib/restaurantSettingsValidation";
import { withTenant } from "@/lib/tenantDb";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { decryptSecret } from "@/lib/cryptoUtils";
import { sendWhatsAppMessage } from "@/lib/whatsappService";

export const POST = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const validation = validateWhatsappTestPhone(body?.phone);
  if (!validation.valid) {
    return Response.json(
      { success: false, error: validation.message ?? "Valid phone number required." },
      { status: 422 }
    );
  }
  const phone = extractIndianMobileDigits(body?.phone);

  const doc = await db.collection("restaurant_whatsapp_settings").findOne({ restaurantId });
  if (!doc?.enabled) {
    return Response.json({ success: false, error: "WhatsApp automation is disabled. Enable and save settings first." }, { status: 400 });
  }
  if (!doc?.token || !doc?.phoneNumberId) {
    return Response.json({ success: false, error: "WhatsApp not configured. Save API Token and Phone Number ID first." }, { status: 400 });
  }

  const token = decryptSecret(doc.token);
  if (!token) {
    return Response.json({ success: false, error: "Invalid token. Please re-enter and save." }, { status: 400 });
  }

  const message = `✅ Test message from your Restaurant Management System!\n\nWhatsApp automation is working correctly. 🎉`;

  const result = await sendWhatsAppMessage({ to: phone, message, db, restaurantId });

  if (result.success) {
    return Response.json({ success: true, message: `Test message sent to +${phone}`, messageId: result.messageId });
  } else {
    return Response.json({ success: false, error: result.error }, { status: 400 });
  }
});
