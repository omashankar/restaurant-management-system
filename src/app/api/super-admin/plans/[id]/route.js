import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function superAdminOnly(request) {
  const token   = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

function toOid(id) {
  try { return new ObjectId(id); } catch { return null; }
}

/* ── PATCH /api/super-admin/plans/:id ── */
export async function PATCH(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const update = { updatedAt: new Date() };
  let monthlyCandidate = null;
  let yearlyCandidate = null;
  if (body.name != null) {
    const trimmed = String(body.name).trim();
    if (!trimmed) return Response.json({ success: false, error: "Plan name cannot be empty." }, { status: 400 });
    update.name = trimmed;
    update.slug = trimmed.toLowerCase().replace(/\s+/g, "-");
  }
  if (body.price != null) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return Response.json({ success: false, error: "Price must be a non-negative number." }, { status: 400 });
    }
    update.price = price;
  }
  if (body.monthlyPrice != null) {
    const monthly = Number(body.monthlyPrice);
    if (!Number.isFinite(monthly) || monthly < 0) {
      return Response.json({ success: false, error: "monthlyPrice must be a non-negative number." }, { status: 400 });
    }
    update.monthlyPrice = monthly;
    monthlyCandidate = monthly;
  }
  if (body.yearlyPrice != null) {
    const yearly = Number(body.yearlyPrice);
    if (!Number.isFinite(yearly) || yearly < 0) {
      return Response.json({ success: false, error: "yearlyPrice must be a non-negative number." }, { status: 400 });
    }
    update.yearlyPrice = yearly;
    yearlyCandidate = yearly;
  }
  if (body.billingCycle != null) {
    if (!["monthly", "yearly"].includes(body.billingCycle)) {
      return Response.json({ success: false, error: "Invalid billingCycle." }, { status: 400 });
    }
    update.billingCycle = body.billingCycle;
  }
  if (body.description != null) update.description = body.description.trim();
  if (Array.isArray(body.features)) update.features = body.features;
  if (body.limits)        update.limits = body.limits;
  if (body.isActive != null) update.isActive = Boolean(body.isActive);
  if (Object.keys(update).length === 1) {
    return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    if (update.slug) {
      const existingWithSlug = await db.collection("plans").findOne({ slug: update.slug, _id: { $ne: _id } }, { projection: { _id: 1 } });
      if (existingWithSlug) {
        return Response.json({ success: false, error: "Another plan with this name already exists." }, { status: 409 });
      }
    }

    if (update.monthlyPrice != null || update.yearlyPrice != null || update.billingCycle != null) {
      const existing = await db.collection("plans").findOne(
        { _id },
        { projection: { monthlyPrice: 1, yearlyPrice: 1, billingCycle: 1, price: 1 } }
      );
      if (!existing) return Response.json({ success: false, error: "Plan not found." }, { status: 404 });
      const nextMonthly = monthlyCandidate ?? Number(existing.monthlyPrice ?? (existing.billingCycle === "yearly" ? Number((Number(existing.price ?? 0) / 12).toFixed(2)) : Number(existing.price ?? 0)));
      const nextYearly = yearlyCandidate ?? Number(existing.yearlyPrice ?? (existing.billingCycle === "yearly" ? Number(existing.price ?? 0) : Number((Number(existing.price ?? 0) * 12).toFixed(2))));
      const nextCycle = update.billingCycle ?? existing.billingCycle ?? "monthly";
      update.price = nextCycle === "yearly" ? nextYearly : nextMonthly;
    }

    const result = await db.collection("plans").updateOne({ _id }, { $set: update });
    if (result.matchedCount === 0) return Response.json({ success: false, error: "Plan not found." }, { status: 404 });
    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── DELETE /api/super-admin/plans/:id ── */
export async function DELETE(request, { params }) {
  if (!superAdminOnly(request)) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    // Check if any restaurant uses this plan
    const plan = await db.collection("plans").findOne({ _id }, { projection: { slug: 1 } });
    if (!plan) return Response.json({ success: false, error: "Plan not found." }, { status: 404 });

    const inUse = await db.collection("restaurants").countDocuments({ plan: plan.slug });
    if (inUse > 0) {
      return Response.json({
        success: false,
        error: `Cannot delete — ${inUse} restaurant${inUse > 1 ? "s" : ""} use this plan.`,
      }, { status: 409 });
    }

    await db.collection("plans").deleteOne({ _id });
    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
