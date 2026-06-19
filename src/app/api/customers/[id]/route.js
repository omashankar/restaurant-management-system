import { withTenant } from "@/lib/tenantDb";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import { parseSchema, customerUpsertSchema } from "@/lib/validationSchemas";
import { assertRealEmail, realEmailErrorResponse } from "@/lib/realEmailValidation";
import { ObjectId } from "mongodb";

function toOid(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

export const GET = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }
    const customer = await db.collection("customers").findOne({ ...tenantFilter, _id });
    if (!customer) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }
    return Response.json({
      success: true,
      customer: { ...customer, id: customer._id.toString(), _id: undefined },
    });
  }
);

export const PATCH = withTenant(
  ["admin", "manager", "waiter"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const body = await request.json();

    const current = await db.collection("customers").findOne(
      { ...tenantFilter, _id },
      { projection: { name: 1, phone: 1, email: 1, notes: 1 } }
    );
    if (!current) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    const touchesProfile =
      typeof body.name === "string" ||
      typeof body.phone === "string" ||
      typeof body.email === "string" ||
      typeof body.notes === "string";

    let validatedProfile = null;
    if (touchesProfile) {
      try {
        validatedProfile = parseSchema(customerUpsertSchema, {
          name: typeof body.name === "string" ? body.name : current.name,
          phone: typeof body.phone === "string" ? body.phone : current.phone,
          email: typeof body.email === "string" ? body.email : (current.email ?? ""),
          notes: typeof body.notes === "string" ? body.notes : (current.notes ?? ""),
        });
      } catch (err) {
        return Response.json({ success: false, error: err.message }, { status: 400 });
      }

      if (validatedProfile.email) {
        try {
          await assertRealEmail(validatedProfile.email);
        } catch (err) {
          const res = realEmailErrorResponse(err);
          if (res) return res;
          throw err;
        }
      }
    }

    const update = {
      updatedAt: new Date(),
    };

    if (validatedProfile) {
      update.name = validatedProfile.name;
      update.phone = extractIndianMobileDigits(validatedProfile.phone);
      update.email = validatedProfile.email ?? "";
      update.notes = validatedProfile.notes ?? "";
    }
    if (typeof body.lastVisit === "string" || body.lastVisit === null) update.lastVisit = body.lastVisit;
    if (typeof body.visits === "number") update.visits = Math.max(0, body.visits);
    if (Array.isArray(body.orderHistory)) update.orderHistory = body.orderHistory;

    if (validatedProfile && update.phone !== current.phone) {
      const duplicate = await db.collection("customers").findOne({
        ...tenantFilter,
        phone: update.phone,
        _id: { $ne: _id },
      });
      if (duplicate) {
        return Response.json({
          success: false,
          error: "Another customer already uses this phone number.",
        }, { status: 409 });
      }
    }

    const result = await db.collection("customers").updateOne(
      { ...tenantFilter, _id },
      { $set: update }
    );
    if (result.matchedCount === 0) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  }
);

export const DELETE = withTenant(
  ["admin", "manager"],
  async ({ db, tenantFilter }, request, { params }) => {
    const _id = toOid(params.id);
    if (!_id) {
      return Response.json({ success: false, error: "Invalid ID." }, { status: 400 });
    }

    const result = await db.collection("customers").deleteOne({ ...tenantFilter, _id });
    if (result.deletedCount === 0) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }
    return Response.json({ success: true });
  }
);
