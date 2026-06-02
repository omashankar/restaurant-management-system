import {
  IMAGE_UPLOAD_MAX_BYTES,
  saveUploadedImage,
  validateImageUploadFile,
} from "@/lib/uploadImage";
import { withTenant } from "@/lib/tenantDb";

export const runtime = "nodejs";

/** Menu item photos — tenant-scoped uploads */
export const POST = withTenant(["admin", "manager"], async ({ payload }, request) => {
  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("Menu item image upload formData error:", err.message);
    return Response.json(
      {
        success: false,
        error: "Could not read the upload. Use a JPG, PNG, or WebP file under 5MB.",
      },
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

  const imageUrl = await saveUploadedImage({
    file,
    mime: validation.mime,
    subdir: "menu-items",
    namePrefix: "menu",
    restaurantId: payload.restaurantId,
  });

  return Response.json({ success: true, imageUrl });
});
