import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { extensionFromMimeType } from "@/lib/uploadImageShared";

export {
  IMAGE_UPLOAD_MAX_BYTES,
  extensionFromMimeType,
  resolveImageMimeType,
  validateImageUploadFile,
} from "@/lib/uploadImageShared";

export async function saveUploadedImage({
  file,
  mime,
  subdir,
  namePrefix,
  restaurantId,
}) {
  const ext = extensionFromMimeType(mime);
  const restaurantPart = restaurantId
    ? String(restaurantId).replace(/[^\w-]/g, "")
    : "shared";
  const filename = `${namePrefix}-${restaurantPart}-${Date.now()}-${randomUUID()}.${ext}`;

  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));

  return `/uploads/${subdir}/${filename}`;
}
