/**
 * On-Demand Revalidation API
 * Called by the Super Admin after saving landing page content.
 * Purges the Next.js cache for the public landing page so the
 * next visitor sees the updated content immediately.
 *
 * POST /api/revalidate
 * Body: { secret: string, paths: string[] }
 *
 * Security: requires REVALIDATION_SECRET env variable.
 * Set it in .env:  REVALIDATION_SECRET=your_random_secret_here
 */

import { revalidatePath } from "next/cache";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";

export async function POST(request) {
  /* ── Auth: super_admin JWT OR revalidation secret ── */
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  const isSuperAdmin = payload?.role === "super_admin";

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  /* Allow either super_admin cookie OR secret token for CI/CD use */
  const secret = process.env.REVALIDATION_SECRET;
  const hasValidSecret = secret && body.secret === secret;

  if (!isSuperAdmin && !hasValidSecret) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  /* Paths to revalidate — defaults to the public landing page */
  const paths = Array.isArray(body.paths) && body.paths.length > 0
    ? body.paths
    : ["/"];

  try {
    const revalidated = [];
    for (const path of paths) {
      revalidatePath(path);
      revalidated.push(path);
    }

    return Response.json({
      success:     true,
      revalidated,
      revalidatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Revalidation error:", err.message);
    return Response.json({ success: false, error: "Revalidation failed." }, { status: 500 });
  }
}
