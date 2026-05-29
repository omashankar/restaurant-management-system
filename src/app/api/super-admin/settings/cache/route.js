/**
 * POST /api/super-admin/settings/cache
 * Clear server-side cache (Next.js revalidation + any in-memory caches).
 */
import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { revalidatePath, revalidateTag } from "next/cache";
import { getClientIp } from "@/lib/rateLimit";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function POST(request) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }
  try {
    revalidatePath("/", "layout");
    revalidatePath("/super-admin", "layout");
    revalidatePath("/super-admin/settings");
    revalidatePath("/super-admin/landing-site");
    revalidateTag("landing");

    await writeAuditLog({
      action: "system.cache_cleared",
      category: "system",
      actorId: sa.id,
      ip: getClientIp(request),
    });

    return Response.json({ success: true, message: "Selected caches cleared and revalidated." });
  } catch (err) {
    console.error("Cache clear error:", err.message);
    return Response.json({ success: false, error: "Failed to clear cache." }, { status: 500 });
  }
}
