import { getAuthPayload } from "@/lib/tenantDb";
import clientPromise from "@/lib/mongodb";
import {
  deleteUploadedImageIfReplaced,
  LOGO_UPLOAD_MAX_BYTES,
  saveUploadedImage,
  validateImageUploadFile,
} from "@/lib/uploadImage";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

function serializeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    avatarUrl: user.avatarUrl ?? "",
    role: user.role,
    restaurantId: user.restaurantId?.toString() ?? null,
    isVerified: user.isVerified ?? true,
    status: user.status ?? "active",
  };
}

/** Upload profile photo for the logged-in user */
export async function POST(request) {
  try {
    const payload = getAuthPayload(request);
    if (!payload?.id) {
      return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (err) {
      console.error("Avatar upload formData error:", err.message);
      return Response.json(
        { success: false, error: "Could not read the upload." },
        { status: 400 }
      );
    }

    const file = formData.get("image");
    const validation = validateImageUploadFile(file, LOGO_UPLOAD_MAX_BYTES);
    if (!validation.ok) {
      return Response.json(
        { success: false, error: validation.error },
        { status: validation.status }
      );
    }

    let _id;
    try {
      _id = new ObjectId(payload.id);
    } catch {
      return Response.json({ success: false, error: "Invalid user ID." }, { status: 401 });
    }

    const avatarUrl = await saveUploadedImage({
      file,
      mime: validation.mime,
      subdir: "user-avatars",
      namePrefix: "user",
      restaurantId: payload.id,
    });

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection("users").findOne(
      { _id },
      { projection: { avatarUrl: 1 } }
    );

    await db.collection("users").updateOne(
      { _id },
      { $set: { avatarUrl, updatedAt: new Date() } }
    );

    await deleteUploadedImageIfReplaced(existing?.avatarUrl, avatarUrl);

    const updated = await db.collection("users").findOne(
      { _id },
      { projection: { password: 0 } }
    );

    return Response.json({
      success: true,
      avatarUrl,
      user: serializeUser(updated),
    });
  } catch (err) {
    console.error("/api/auth/profile/avatar error:", err.message);
    return Response.json(
      { success: false, error: err.message ?? "Something went wrong." },
      { status: 500 }
    );
  }
}
