/**
 * GET   /api/printer-settings — load printers for restaurant
 * PATCH /api/printer-settings — save printer list
 */
import { withTenant } from "@/lib/tenantDb";
import { sanitizePrinters } from "@/lib/networkPrinter";

export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, restaurantId }) => {
    const doc = await db.collection("restaurant_printer_settings").findOne({ restaurantId });
    const printers = sanitizePrinters(doc?.printers ?? []);
    return Response.json({ success: true, printers });
  }
);

export const PATCH = withTenant(["admin"], async ({ db, restaurantId }, request) => {
  const body = await request.json();
  const printers = sanitizePrinters(body.printers ?? []);

  await db.collection("restaurant_printer_settings").updateOne(
    { restaurantId },
    { $set: { printers, updatedAt: new Date() } },
    { upsert: true }
  );

  return Response.json({ success: true, printers });
});
