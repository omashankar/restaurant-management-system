import { getAuthPayload } from "@/lib/tenantDb";
import { validatePlatformPassword } from "@/lib/platformPassword";
import { getPlatformSettings } from "@/lib/platformSettings";
import { validatePasswordChangeForm } from "@/lib/restaurantSettingsValidation";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload?.id) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const platform = await getPlatformSettings(db);
    const security = platform.security ?? {};

    const validation = validatePasswordChangeForm(
      {
        current: body.current,
        next: body.next,
        confirm: body.confirm,
      },
      security
    );
    if (!validation.valid) {
      return Response.json(
        { success: false, error: validation.message ?? "Validation failed.", errors: validation.errors },
        { status: 422 }
      );
    }

    const platformPwd = validatePlatformPassword(body.next, security);
    if (!platformPwd.valid) {
      return Response.json(
        {
          success: false,
          error: platformPwd.error,
          errors: { next: platformPwd.error },
        },
        { status: 422 }
      );
    }

    let _id;
    try {
      _id = new ObjectId(payload.id);
    } catch {
      return Response.json({ success: false, error: "Invalid user ID." }, { status: 401 });
    }

    const user = await db.collection("users").findOne({ _id });
    if (!user?.password) {
      return Response.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const match = await bcrypt.compare(String(body.current), user.password);
    if (!match) {
      return Response.json(
        { success: false, error: "Current password is incorrect.", errors: { current: "Current password is incorrect." } },
        { status: 401 }
      );
    }

    const hashed = await bcrypt.hash(String(body.next), 12);
    await db.collection("users").updateOne(
      { _id },
      { $set: { password: hashed, updatedAt: new Date() } }
    );

    return Response.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("/api/auth/change-password error:", err.message);
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
