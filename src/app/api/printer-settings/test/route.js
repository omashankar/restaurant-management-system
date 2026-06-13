/**
 * POST /api/printer-settings/test — send ESC/POS test to a network printer
 */
import { normalizeLocalePrefs } from "@/lib/localeFormat";
import { withTenant } from "@/lib/tenantDb";
import { buildEscPosTest, sanitizePrinter, sendToNetworkPrinter } from "@/lib/networkPrinter";

export const POST = withTenant(["admin", "manager"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const printer = sanitizePrinter(body.printer ?? {});

  if (printer.type === "usb" || printer.type === "bluetooth") {
    return Response.json({
      success: true,
      message: "USB/Bluetooth printers use POS → Print Bill via your browser print dialog. Settings saved.",
      browserOnly: true,
    });
  }

  if (!printer.ipAddress) {
    return Response.json({ success: false, error: "Enter a valid IP address for network printers." }, { status: 400 });
  }

  const settingsDoc = await db.collection("restaurant_settings").findOne(
    { restaurantId },
    { projection: { general: 1 } }
  ).catch(() => null);
  const restaurantName = settingsDoc?.general?.restaurantName ?? "Restaurant";
  const localePrefs = normalizeLocalePrefs(settingsDoc?.general ?? {});

  try {
    const data = buildEscPosTest({ restaurantName, localePrefs });
    await sendToNetworkPrinter({
      host: printer.ipAddress,
      port: printer.port,
      data,
    });
    return Response.json({
      success: true,
      message: `Test print sent to ${printer.ipAddress}:${printer.port}`,
    });
  } catch (err) {
    return Response.json({
      success: false,
      error: err.message ?? "Could not reach printer.",
    }, { status: 400 });
  }
});
