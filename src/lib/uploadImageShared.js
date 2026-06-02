export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export function resolveImageMimeType(file) {
  const type = (file?.type ?? "").toLowerCase();
  if (ALLOWED_TYPES.has(type)) return type;

  const name = (file?.name ?? "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  return type;
}

export function extensionFromMimeType(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

/** Type-only check (any file size — used before client compression). */
export function validateImageFileType(file) {
  if (!file || typeof file === "string") {
    return { ok: false, error: "Image file is required." };
  }

  const mime = resolveImageMimeType(file);
  if (!ALLOWED_TYPES.has(mime)) {
    return {
      ok: false,
      error: "Only JPG, PNG, or WebP files are allowed.",
    };
  }

  return { ok: true, mime };
}

export function validateImageUploadFile(file, maxBytes = IMAGE_UPLOAD_MAX_BYTES) {
  const typeCheck = validateImageFileType(file);
  if (!typeCheck.ok) {
    return { ok: false, status: 400, error: typeCheck.error };
  }

  const mime = typeCheck.mime;

  const size = file.size ?? 0;
  if (size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return {
      ok: false,
      status: 400,
      error: `Image must be ${mb}MB or smaller.`,
    };
  }

  return { ok: true, mime };
}
