import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import {
  parseSchema,
  superAdminPlanPatchSchema,
  superAdminPlanUpsertSchema,
} from "@/lib/validationSchemas";
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

function toPlanSlug(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ── PATCH /api/super-admin/plans/:id ── */
export async function PATCH(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const hasPlanFields =
    body.name != null ||
    body.monthlyPrice != null ||
    body.yearlyPrice != null ||
    body.billingCycle != null ||
    body.description != null ||
    Array.isArray(body.features) ||
    body.limits != null;

  if (!hasPlanFields && body.isActive == null && body.price == null) {
    return Response.json({ success: false, error: "No valid fields to update." }, { status: 400 });
  }

  const update = { updatedAt: new Date() };
  let monthlyCandidate = null;
  let yearlyCandidate = null;

  if (hasPlanFields) {
    const limitKeys = ["staff", "tables", "menuItems", "orders"];
    let normalizedLimits;
    if (body.limits != null) {
      normalizedLimits = {};
      for (const k of limitKeys) {
        const raw = body.limits[k];
        if (raw == null || raw === "") {
          normalizedLimits[k] = -1;
          continue;
        }
        const n = Number(raw);
        if (!Number.isInteger(n) || n < -1) {
          return Response.json(
            { success: false, error: `Invalid limit for ${k}: use -1 (unlimited) or a whole number ≥ -1.` },
            { status: 400 }
          );
        }
        normalizedLimits[k] = n;
      }
    }

    const patchInput = {};
    if (body.name != null) patchInput.name = String(body.name).trim();
    if (body.monthlyPrice != null) patchInput.monthlyPrice = Number(body.monthlyPrice);
    if (body.yearlyPrice != null) patchInput.yearlyPrice = Number(body.yearlyPrice);
    if (body.billingCycle != null) patchInput.billingCycle = body.billingCycle;
    if (body.description != null) patchInput.description = String(body.description).trim();
    if (Array.isArray(body.features)) patchInput.features = body.features;
    if (normalizedLimits) patchInput.limits = normalizedLimits;

    const hasAllCoreFields =
      patchInput.name != null &&
      patchInput.monthlyPrice != null &&
      patchInput.yearlyPrice != null &&
      patchInput.billingCycle != null;

    try {
      const validated = parseSchema(
        hasAllCoreFields ? superAdminPlanUpsertSchema : superAdminPlanPatchSchema,
        hasAllCoreFields
          ? {
              ...patchInput,
              description: patchInput.description ?? "",
              features: patchInput.features ?? [],
              limits: patchInput.limits ?? normalizedLimits,
            }
          : patchInput
      );
      if (validated.name != null) {
        update.name = validated.name;
        update.slug = toPlanSlug(validated.name);
      }
      if (validated.monthlyPrice != null) {
        update.monthlyPrice = validated.monthlyPrice;
        monthlyCandidate = validated.monthlyPrice;
      }
      if (validated.yearlyPrice != null) {
        update.yearlyPrice = validated.yearlyPrice;
        yearlyCandidate = validated.yearlyPrice;
      }
      if (validated.billingCycle != null) update.billingCycle = validated.billingCycle;
      if (validated.description != null) update.description = validated.description;
      if (validated.features != null) update.features = validated.features;
      if (validated.limits != null) update.limits = validated.limits;
    } catch (err) {
      return Response.json({ success: false, error: err.message }, { status: 400 });
    }
  }

  if (body.price != null) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return Response.json({ success: false, error: "Price must be a non-negative number." }, { status: 400 });
    }
    update.price = price;
  }
  if (body.isActive != null) update.isActive = Boolean(body.isActive);

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

    const plan = await db.collection("plans").findOne({ _id }, { projection: { name: 1, slug: 1 } });
    await writeAuditLog({
      action: "billing.plan_updated",
      category: "billing",
      actorId: sa.id,
      targetId: id,
      targetName: plan?.name ?? id,
      meta: { slug: plan?.slug },
      ip: getClientIp(request),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── DELETE /api/super-admin/plans/:id ── */
export async function DELETE(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) return Response.json({ success: false, error: "Forbidden." }, { status: 403 });

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

    await writeAuditLog({
      action: "billing.plan_deleted",
      category: "billing",
      actorId: sa.id,
      targetId: id,
      targetName: plan.name,
      meta: { slug: plan.slug },
      ip: getClientIp(request),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE plan error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
