/**
 * POST /api/super-admin/settings/cache
 * Clear server-side cache (Next.js revalidation + any in-memory caches).
 */
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { revalidatePath, revalidateTag } from "next/cache";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  try {
    revalidatePath("/", "layout");
    revalidatePath("/super-admin", "layout");
    revalidatePath("/super-admin/settings");
    revalidatePath("/super-admin/landing-site");
    revalidateTag("landing");
    return Response.json({ success: true, message: "Selected caches cleared and revalidated." });
  } catch (err) {
    console.error("Cache clear error:", err.message);
    return Response.json({ success: false, error: "Failed to clear cache." }, { status: 500 });
  }
}
