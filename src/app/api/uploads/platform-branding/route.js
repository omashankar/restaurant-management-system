import {
  LOGO_UPLOAD_MAX_BYTES,
  saveUploadedImage,
  validateImageUploadFile,
} from "@/lib/uploadImage";
import { getTokenFromRequest } from "@/lib/authCookies";
import { verifyToken } from "@/lib/jwt";

export const runtime = "nodejs";

function superAdminOnly(request) {
  const token = getTokenFromRequest(request);
  const payload = token ? verifyToken(token) : null;
  if (!payload || payload.role !== "super_admin") return null;
  return payload;
}

/** Platform logo / favicon — super admin only, stored under platform-branding/ */
export async function POST(request) {
  if (!superAdminOnly(request)) {
    return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    console.error("Platform branding upload formData error:", err.message);
    return Response.json(
      { success: false, error: "Could not read the upload." },
      { status: 400 }
    );
  }

  const file = formData.get("image");
  const kind = String(formData.get("kind") ?? "logo").trim().toLowerCase();
  const namePrefix = kind === "favicon" ? "favicon" : "logo";

  const validation = validateImageUploadFile(file, LOGO_UPLOAD_MAX_BYTES);
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
      subdir: "platform-branding",
      namePrefix,
      restaurantId: null,
    });
    return Response.json({ success: true, imageUrl });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message ?? "Upload failed." },
      { status: 500 }
    );
  }
}
