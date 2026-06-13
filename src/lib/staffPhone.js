import { extractIndianMobileDigits, isValidIndianMobile } from "@/lib/phoneUtils";
import { ObjectId } from "mongodb";

/** Roles managed under Staff panel — mobile must be unique per restaurant when set. */
export const STAFF_PANEL_ROLES = ["manager", "waiter", "chef"];

/** Store 10-digit Indian mobile or empty string. */
export function normalizeStaffPhoneStored(phone) {
  const digits = extractIndianMobileDigits(phone);
  return isValidIndianMobile(digits) ? digits : "";
}

/**
 * @param {import("mongodb").Db} db
 * @param {{ tenantFilter: object; phone: string; excludeUserId?: string | null }} params
 * @returns {Promise<{ _id: import("mongodb").ObjectId; name?: string; phone?: string } | null>}
 */
export async function findStaffPhoneConflict(db, { tenantFilter, phone, excludeUserId = null }) {
  const phoneStored = normalizeStaffPhoneStored(phone);
  if (!phoneStored) return null;

  const filter = {
    ...tenantFilter,
    role: { $in: STAFF_PANEL_ROLES },
    phone: { $nin: ["", null] },
  };
  if (excludeUserId) {
    try {
      filter._id = { $ne: new ObjectId(excludeUserId) };
    } catch {
      return null;
    }
  }

  const rows = await db
    .collection("users")
    .find(filter, { projection: { name: 1, phone: 1 } })
    .toArray();

  return rows.find((u) => normalizeStaffPhoneStored(u.phone) === phoneStored) ?? null;
}

export function staffPhoneConflictMessage(name) {
  return name
    ? `Another staff member (${name}) already uses this mobile number.`
    : "Another staff member already uses this mobile number.";
}
