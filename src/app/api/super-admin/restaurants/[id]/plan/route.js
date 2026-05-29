import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import { assignPlan } from "@/lib/subscription";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

export async function PATCH(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const { plan, startDate, endDate, trialDays } = body;
  if (!plan?.trim()) return Response.json({ success: false, error: "Plan slug is required." }, { status: 400 });

  try {
    await assignPlan(id, plan.trim(), { startDate, endDate, trialDays });

    let targetName = id;
    try {
      const client = await clientPromise;
      const restaurant = await client.db().collection("restaurants").findOne(
        { _id: new ObjectId(id) },
        { projection: { name: 1 } },
      );
      targetName = restaurant?.name ?? id;
    } catch {
      /* keep id as fallback */
    }

    await writeAuditLog({
      action: "billing.plan_assigned",
      category: "billing",
      actorId: sa.id,
      targetId: id,
      targetName,
      meta: { plan: plan.trim() },
      ip: getClientIp(request),
    });

    return Response.json({ success: true, plan: plan.trim() });
  } catch (err) {
    const status = err.message.includes("not found") ? 404 : 500;
    return Response.json({ success: false, error: err.message }, { status });
  }
}
