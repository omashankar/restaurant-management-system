/**
 * Per-item Landing CMS routes (array sections only)
 *
 * PATCH  /api/super-admin/landing/:section/:itemId  → update one item
 * DELETE /api/super-admin/landing/:section/:itemId  → delete one item
 *
 * Valid array sections: features | roles | pricing | testimonials
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { deleteItem, updateItem, VALID_SECTIONS } from "@/lib/landingService";
import { revalidatePath, revalidateTag } from "next/cache";

const ARRAY_SECTIONS = ["features", "roles", "pricing", "testimonials"];

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function validateSection(section) {
  if (!VALID_SECTIONS.includes(section))
    return Response.json({ success: false, error: `Invalid section "${section}".` }, { status: 400 });
  if (!ARRAY_SECTIONS.includes(section))
    return Response.json({ success: false, error: `"${section}" does not support individual items. Use PUT to replace the whole section.` }, { status: 400 });
  return null;
}

/* ── PATCH /api/super-admin/landing/:section/:itemId ── */
export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  const { section, itemId } = await params;
  const err = validateSection(section);
  if (err) return err;
  let body;
  try { body = await request.json(); } catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }
  try {
    const result = await updateItem(section, itemId, body);
    revalidateTag("landing");
    revalidatePath("/");
    return Response.json({ success: true, ...result });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: e.status ?? 500 });
  }
}

/* ── DELETE /api/super-admin/landing/:section/:itemId ── */
export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  const { section, itemId } = await params;
  const err = validateSection(section);
  if (err) return err;
  try {
    const result = await deleteItem(section, itemId);
    revalidateTag("landing");
    revalidatePath("/");
    return Response.json({ success: true, ...result });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: e.status ?? 500 });
  }
}
