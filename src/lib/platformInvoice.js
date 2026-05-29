import { getPlatformSettings } from "@/lib/platformSettings";

/** @param {import("mongodb").Db} db */
export async function generatePlatformInvoiceId(db) {
  const settings = await getPlatformSettings(db);
  const prefix = String(settings.advanced?.invoicePrefix ?? "INV-").trim() || "INV-";
  return `${prefix}${Date.now()}`;
}
