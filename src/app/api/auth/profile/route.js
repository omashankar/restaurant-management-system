import { getAuthPayload, assertActiveTenantAccess } from "@/lib/tenantDb";
import { getProfileFormFieldErrors } from "@/lib/formValidation";
import { assertRealEmail, realEmailErrorResponse } from "@/lib/realEmailValidation";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    restaurantId: user.restaurantId?.toString() ?? null,
    isVerified: user.isVerified ?? true,
    status: user.status ?? "active",
  };
}

export async function PATCH(request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload?.id) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const form = {
      name: String(body.name ?? "").trim(),
      email: String(body.email ?? "").trim().toLowerCase(),
      phone: extractIndianMobileDigits(body.phone),
    };

    const validation = getProfileFormFieldErrors(form);
    if (!validation.valid) {
      return Response.json(
        { success: false, error: validation.message ?? "Validation failed.", errors: validation.errors },
        { status: 422 }
      );
    }

    try {
      await assertRealEmail(form.email);
    } catch (err) {
      const res = realEmailErrorResponse(err);
      if (res) return res;
      throw err;
    }

    let _id;
    try {
      _id = new ObjectId(payload.id);
    } catch {
      return Response.json({ success: false, error: "Invalid user ID." }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

    try {
      await assertActiveTenantAccess(db, payload);
    } catch (err) {
      if (err.status) {
        return Response.json({ success: false, error: err.message }, { status: err.status });
      }
      throw err;
    }

    const existing = await db.collection("users").findOne({ _id });
    if (!existing) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const emailTaken = await db.collection("users").findOne({
      email: form.email,
      _id: { $ne: _id },
    });
    if (emailTaken) {
      return Response.json(
        { success: false, error: "This email is already in use.", errors: { email: "This email is already in use." } },
        { status: 409 }
      );
    }

    await db.collection("users").updateOne(
      { _id },
      {
        $set: {
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          updatedAt: new Date(),
        },
      }
    );

    const updated = await db.collection("users").findOne(
      { _id },
      { projection: { password: 0 } }
    );

    return Response.json({ success: true, user: serializeUser(updated) });
  } catch (err) {
    console.error("/api/auth/profile PATCH error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
