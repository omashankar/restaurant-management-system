import { writeAuditLog } from "@/lib/auditLog";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";
import clientPromise from "@/lib/mongodb";
import { getClientIp } from "@/lib/rateLimit";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { parseSchema, superAdminRestaurantUpdateSchema } from "@/lib/validationSchemas";
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
const VALID_PLANS = ["free", "starter", "pro", "enterprise"];

/* ── PATCH /api/super-admin/restaurants/:id — update status / plan ── */
export async function PATCH(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 }); }

  const cleanSlug = String(body?.slug ?? "").toLowerCase().replace(/[^a-z0-9-]/g, "").trim();

  let validated;
  try {
    validated = parseSchema(superAdminRestaurantUpdateSchema, { ...body, slug: cleanSlug });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 400 });
  }

  const update = {
    name: validated.name,
    slug: validated.slug,
    phone: validated.phone ? extractIndianMobileDigits(validated.phone) : "",
    address: validated.address?.trim() ?? "",
    plan: validated.plan,
    updatedAt: new Date(),
  };

  if (body.status && ["active", "inactive", "suspended"].includes(body.status)) {
    update.status = body.status;
  }

  try {
    const client = await clientPromise;
    const db     = client.db();

    const existingSlug = await db.collection("restaurants").findOne({
      slug: update.slug,
      _id: { $ne: _id },
    });
    if (existingSlug) {
      return Response.json({
        success: false,
        error: "Yeh slug pehle se kisi aur restaurant ke paas hai.",
      }, { status: 409 });
    }

    const { invalidateRestaurantSlugCache } = await import("@/lib/restaurantResolver");
    const oldDoc = await db.collection("restaurants").findOne({ _id }, { projection: { slug: 1 } });
    if (oldDoc?.slug) invalidateRestaurantSlugCache(oldDoc.slug);
    if (update.slug) invalidateRestaurantSlugCache(update.slug);

    const session = client.startSession();
    try {
      let notFound = false;
      await session.withTransaction(async () => {
        const result = await db.collection("restaurants").updateOne({ _id }, { $set: update }, { session });
        if (result.matchedCount === 0) {
          notFound = true;
          return;
        }

        // If disabling restaurant, also deactivate its users
        if (body.status === "inactive" || body.status === "suspended") {
          await db.collection("users").updateMany(
            { restaurantId: _id, role: { $ne: "super_admin" } },
            { $set: { status: "inactive" } },
            { session }
          );
        }
        // If re-enabling, reactivate users
        if (body.status === "active") {
          await db.collection("users").updateMany(
            { restaurantId: _id, role: { $ne: "super_admin" } },
            { $set: { status: "active" } },
            { session }
          );
        }
      });
      if (notFound) {
        return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
      }
    } finally {
      await session.endSession();
    }

    const restaurant = await db.collection("restaurants").findOne(
      { _id },
      { projection: { name: 1, status: 1 } },
    );
    let action = "restaurant.updated";
    if (body.status === "active") action = "restaurant.activated";
    else if (body.status === "inactive" || body.status === "suspended") action = "restaurant.deactivated";

    await writeAuditLog({
      action,
      category: "restaurant",
      actorId: sa.id,
      targetId: id,
      targetName: restaurant?.name ?? id,
      meta: { fields: Object.keys(update).filter((k) => k !== "updatedAt") },
      ip: getClientIp(request),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("PATCH restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}

/* ── DELETE /api/super-admin/restaurants/:id ── */
export async function DELETE(request, { params }) {
  const sa = superAdminOnly(request);
  if (!sa) {
    return Response.json({ success: false, error: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;
  const _id = toOid(id);
  if (!_id) return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });

  try {
    const client = await clientPromise;
    const db     = client.db();

    const existing = await db.collection("restaurants").findOne(
      { _id },
      { projection: { name: 1 } },
    );

    const session = client.startSession();
    let notFound = false;
    try {
      await session.withTransaction(async () => {
        const result = await db.collection("restaurants").deleteOne({ _id }, { session });
        if (result.deletedCount === 0) {
          notFound = true;
          return;
        }
        // Remove all users belonging to this restaurant
        await db.collection("users").deleteMany({ restaurantId: _id }, { session });
      });
      if (notFound) {
        return Response.json({ success: false, error: "Restaurant not found." }, { status: 404 });
      }
    } finally {
      await session.endSession();
    }

    await writeAuditLog({
      action: "restaurant.deleted",
      category: "restaurant",
      actorId: sa.id,
      targetId: id,
      targetName: existing?.name ?? id,
      ip: getClientIp(request),
    });

    return Response.json({ success: true });
  } catch (err) {
    console.error("DELETE restaurant error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
