import { getAuthPayload } from "@/lib/tenantDb";
import clientPromise from "@/lib/mongodb";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";

const MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function extensionFromType(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

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

    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || typeof file === "string") {
      return Response.json({ success: false, error: "Profile image is required." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return Response.json(
        { success: false, error: "Only JPG, PNG, or WebP files are allowed." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE_BYTES) {
      return Response.json({ success: false, error: "Image must be 2MB or smaller." }, { status: 400 });
    }

    let _id;
    try {
      _id = new ObjectId(payload.id);
    } catch {
      return Response.json({ success: false, error: "Invalid user ID." }, { status: 401 });
    }

    const ext = extensionFromType(file.type);
    const filename = `user-${payload.id}-${Date.now()}-${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "user-avatars");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

    const avatarUrl = `/uploads/user-avatars/${filename}`;

    const client = await clientPromise;
    const db = client.db();
    await db.collection("users").updateOne(
      { _id },
      { $set: { avatarUrl, updatedAt: new Date() } }
    );

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
    return Response.json({ success: false, error: "Something went wrong." }, { status: 500 });
  }
}
