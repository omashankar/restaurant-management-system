import {
  IMAGE_UPLOAD_MAX_BYTES,
  saveUploadedImage,
  validateImageUploadFile,
} from "@/lib/uploadImage";
import { withTenant } from "@/lib/tenantDb";

export const runtime = "nodejs";

export const POST = withTenant(["admin"], async ({ payload }, request) => {
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("Table area image upload formData error:", err.message);
    return Response.json(
      { success: false, error: "Could not read the upload." },
      { status: 400 }
    );
  }

  const file = formData.get("image");
  const validation = validateImageUploadFile(file, IMAGE_UPLOAD_MAX_BYTES);
  if (!validation.ok) {
    return Response.json(
      { success: false, error: validation.error },
      { status: validation.status }
    );
  }

  try {
    const imageUrl = await saveUploadedImage({
      file,
      mime: validation.mime,
      subdir: "table-areas",
      namePrefix: "area",
      restaurantId: payload.restaurantId,
    });
    return Response.json({ success: true, imageUrl });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message ?? "Upload failed." },
      { status: 500 }
    );
  }
});
