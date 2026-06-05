import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { extensionFromMimeType } from "@/lib/uploadImageShared";

export {
  IMAGE_UPLOAD_MAX_BYTES,
  extensionFromMimeType,
  resolveImageMimeType,
  validateImageUploadFile,
} from "@/lib/uploadImageShared";

export const LOGO_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;

/** Blob when token is set, store is connected (BLOB_STORE_ID), or running on Vercel (OIDC). */
function useBlobStorage() {
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim()) return true;
  if (process.env.BLOB_STORE_ID?.trim()) return true;
  return process.env.VERCEL === "1";
}

function isVercelRuntime() {
  return process.env.VERCEL === "1";
}

function buildFilename(namePrefix, restaurantId, ext) {
  const restaurantPart = restaurantId
    ? String(restaurantId).replace(/[^\w-]/g, "")
    : "shared";
  return `${namePrefix}-${restaurantPart}-${Date.now()}-${randomUUID()}.${ext}`;
}

async function saveToLocalDisk({ bytes, subdir, filename }) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes));
  return `/uploads/${subdir}/${filename}`;
}

async function saveToBlob({ bytes, mime, subdir, filename }) {
  const pathname = `${subdir}/${filename}`;
  const blob = await put(pathname, Buffer.from(bytes), {
    access: "public",
    contentType: mime,
    addRandomSuffix: false,
  });
  return blob.url;
}

/**
 * Save an uploaded image. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production),
 * otherwise writes to public/uploads (local dev).
 */
export async function saveUploadedImage({
  file,
  mime,
  subdir,
  namePrefix,
  restaurantId,
}) {
  const ext = extensionFromMimeType(mime);
  const filename = buildFilename(namePrefix, restaurantId, ext);
  const bytes = await file.arrayBuffer();

  try {
    if (useBlobStorage()) {
      return await saveToBlob({ bytes, mime, subdir, filename });
    }
    if (!isVercelRuntime()) {
      return await saveToLocalDisk({ bytes, subdir, filename });
    }
    throw new Error(
      "Blob storage is not configured for this Vercel project. Connect a public Blob store and redeploy."
    );
  } catch (err) {
    console.error("saveUploadedImage failed:", err?.message ?? err);
    if (err instanceof Error && err.message.includes("Blob storage is not configured")) {
      throw err;
    }
    throw new Error(
      useBlobStorage() || isVercelRuntime()
        ? "Image upload failed. In Vercel: Storage → connect Public Blob → add BLOB_READ_WRITE_TOKEN → Redeploy."
        : "Image upload failed. Could not save file."
    );
  }
}

/** Blob or local /uploads paths created by this app (not external pasted URLs). */
export function isManagedUploadUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/uploads/")) return true;
  return trimmed.includes(".blob.vercel-storage.com");
}

/** Collect managed upload URLs from nested CMS/settings objects. */
export function collectManagedUploadUrls(value, found = new Set()) {
  if (typeof value === "string") {
    if (isManagedUploadUrl(value)) found.add(value.trim());
    return found;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectManagedUploadUrls(item, found));
    return found;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectManagedUploadUrls(v, found));
  }
  return found;
}

/** Delete old file when user replaces image (edit flow). */
export async function deleteUploadedImageIfReplaced(oldUrl, newUrl) {
  const old = String(oldUrl ?? "").trim();
  const next = String(newUrl ?? "").trim();
  if (!old || old === next || !isManagedUploadUrl(old)) return;
  await deleteUploadedImage(old);
}

/** Delete managed URLs present in oldData but removed from newData. */
export async function deleteOrphanedManagedUploads(oldData, newData) {
  const oldUrls = collectManagedUploadUrls(oldData);
  const newUrls = collectManagedUploadUrls(newData);
  for (const url of oldUrls) {
    if (!newUrls.has(url)) {
      await deleteUploadedImage(url);
    }
  }
}

/** Remove a previously uploaded image (local path or Blob URL). */
export async function deleteUploadedImage(urlPath) {
  const trimmed = String(urlPath ?? "").trim();
  if (!trimmed) return;

  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) {
    if (!useBlobStorage() || !isManagedUploadUrl(trimmed)) return;
    try {
      const { del } = await import("@vercel/blob");
      await del(trimmed);
    } catch {
      // ignore missing blob
    }
    return;
  }

  if (!trimmed.startsWith("/uploads/")) return;
  const diskPath = path.join(
    process.cwd(),
    "public",
    ...trimmed.replace(/^\//, "").split("/")
  );
  try {
    await unlink(diskPath);
  } catch {
    // ignore missing file
  }
}
