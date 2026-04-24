/**
 * Reorder items in an array section.
 *
 * PATCH /api/super-admin/landing/:section/reorder
 * Body: { ids: ["id1", "id2", "id3"] }
 */

import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { reorderItems, VALID_SECTIONS } from "@/lib/landingService";
import { revalidatePath, revalidateTag } from "next/cache";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  const { section } = await params;
  if (!VALID_SECTIONS.includes(section)) return Response.json({ success: false, error: `Invalid section "${section}".` }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }
  if (!Array.isArray(body.ids) || !body.ids.length) return Response.json({ success: false, error: "ids must be a non-empty array." }, { status: 400 });
  try {
    const result = await reorderItems(section, body.ids);
    revalidateTag("landing");
    revalidatePath("/");
    return Response.json({ success: true, ...result });
  } catch (e) {
    return Response.json({ success: false, error: e.message }, { status: e.status ?? 500 });
  }
}
