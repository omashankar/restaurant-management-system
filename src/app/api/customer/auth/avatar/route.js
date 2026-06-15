import clientPromise from "@/lib/mongodb";
import { getCustomerTokenFromRequest, verifyCustomerToken } from "@/lib/customerAuth";
import { serializeCustomerUser } from "@/lib/customerAccountSerialize";
import {
  deleteUploadedImageIfReplaced,
  LOGO_UPLOAD_MAX_BYTES,
  saveUploadedImage,
  validateImageUploadFile,
} from "@/lib/uploadImage";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

/** Upload profile photo for the logged-in customer. */
export async function POST(request) {
  const token = getCustomerTokenFromRequest(request);
  if (!token) {
    return Response.json({ success: false, error: "Not authenticated." }, { status: 401 });
  }

  const payload = verifyCustomerToken(token);
  if (!payload?.id) {
    return Response.json({ success: false, error: "Invalid token." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("customer avatar formData error:", err.message);
    return Response.json({ success: false, error: "Could not read the upload." }, { status: 400 });
  }

  const file = formData.get("image");
  const validation = validateImageUploadFile(file, LOGO_UPLOAD_MAX_BYTES);
  if (!validation.ok) {
    return Response.json({ success: false, error: validation.error }, { status: validation.status });
  }

  let oid;
  try {
    oid = new ObjectId(payload.id);
  } catch {
    return Response.json({ success: false, error: "Invalid account." }, { status: 401 });
  }

  try {
    const avatarUrl = await saveUploadedImage({
      file,
      mime: validation.mime,
      subdir: "customer-avatars",
      namePrefix: "customer",
      restaurantId: payload.id,
    });

    const client = await clientPromise;
    const db = client.db();
    const existing = await db.collection("customerAccounts").findOne(
      { _id: oid },
      { projection: { avatarUrl: 1 } }
    );
    if (!existing) {
      return Response.json({ success: false, error: "Customer not found." }, { status: 404 });
    }

    await db.collection("customerAccounts").updateOne(
      { _id: oid },
      { $set: { avatarUrl, updatedAt: new Date() } }
    );

    await deleteUploadedImageIfReplaced(existing?.avatarUrl, avatarUrl);

    const account = await db.collection("customerAccounts").findOne(
      { _id: oid },
      { projection: { passwordHash: 0 } }
    );

    return Response.json({
      success: true,
      avatarUrl,
      user: serializeCustomerUser(account),
    });
  } catch (err) {
    console.error("customer.auth.avatar failed:", err.message);
    return Response.json(
      { success: false, error: err.message ?? "Failed to upload profile photo." },
      { status: 500 }
    );
  }
}
