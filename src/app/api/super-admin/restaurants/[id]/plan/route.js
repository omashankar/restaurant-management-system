import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { assignPlan } from "@/lib/subscription";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { plan, startDate, endDate, trialDays } = body;
  if (!plan?.trim()) return Response.json({ success: false, error: "Plan slug is required." }, { status: 400 });

  try {
    await assignPlan(id, plan.trim(), { startDate, endDate, trialDays });
    return Response.json({ success: true, plan: plan.trim() });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return Response.json({ success: false, error: err.message }, { status });
  }
}
