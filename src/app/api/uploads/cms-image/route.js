import { withTenant } from "@/lib/tenantDb";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

function extensionFromType(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/** CMS images (hero, gallery, etc.) — tenant-scoped uploads */
export const POST = withTenant(["admin"], async ({ payload }, request) => {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!file || typeof file === "string") {
    return Response.json({ success: false, error: "Image file is required." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { success: false, error: "Only JPG, PNG, or WebP files are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ success: false, error: "Image must be 5MB or smaller." }, { status: 400 });
  }

  const ext = extensionFromType(file.type);
  const restaurantPart = payload.restaurantId ? String(payload.restaurantId) : "shared";
  const filename = `cms-${restaurantPart}-${Date.now()}-${randomUUID()}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", "cms-images");
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  return Response.json({
    success: true,
    imageUrl: `/uploads/cms-images/${filename}`,
  });
});
