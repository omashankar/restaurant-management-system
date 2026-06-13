import imageCompression from "browser-image-compression";
import {
  IMAGE_UPLOAD_MAX_BYTES,
  validateImageFileType,
  validateImageUploadFile,
} from "@/lib/uploadImageShared";

/** Skip compression when the file is already small enough. */
export const COMPRESS_SKIP_BYTES = 500 * 1024;

const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** @typedef {'default' | 'logo' | 'avatar' | 'tableArea' | 'favicon'} ImageUploadPreset */

/** @type {Record<ImageUploadPreset, { maxSizeMB: number; maxWidthOrHeight: number; maxBytes: number }>} */
const PRESETS = {
  default: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    maxBytes: IMAGE_UPLOAD_MAX_BYTES,
  },
  logo: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 800,
    maxBytes: LOGO_MAX_BYTES,
  },
  avatar: {
    maxSizeMB: 0.35,
    maxWidthOrHeight: 512,
    maxBytes: LOGO_MAX_BYTES,
  },
  tableArea: {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    maxBytes: IMAGE_UPLOAD_MAX_BYTES,
  },
  favicon: {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 128,
    maxBytes: LOGO_MAX_BYTES,
  },
};

function shouldCompress(file, maxBytes) {
  return file.size > COMPRESS_SKIP_BYTES || file.size > maxBytes * 0.85;
}

/**
 * Resize/compress in the browser, then validate against server limits.
 * @param {File} file
 * @param {ImageUploadPreset} [presetKey]
 * @returns {Promise<{ ok: true, file: File } | { ok: false, error: string }>}
 */
export async function prepareImageForUpload(file, presetKey = "default") {
  const preset = PRESETS[presetKey] ?? PRESETS.default;
  const typeCheck = validateImageFileType(file);
  if (!typeCheck.ok) {
    return { ok: false, error: typeCheck.error };
  }

  let processed = file;

  if (shouldCompress(file, preset.maxBytes)) {
    try {
      const baseOpts = {
        maxSizeMB: preset.maxSizeMB,
        maxWidthOrHeight: preset.maxWidthOrHeight,
        useWebWorker: true,
        initialQuality: 0.82,
      };
      if (typeCheck.mime === "image/png") {
        baseOpts.fileType = "image/png";
      }

      processed = await imageCompression(file, baseOpts);

      if (processed.size > preset.maxBytes) {
        processed = await imageCompression(file, {
          maxSizeMB: Math.max(0.2, preset.maxSizeMB * 0.65),
          maxWidthOrHeight: Math.round(preset.maxWidthOrHeight * 0.75),
          useWebWorker: true,
          initialQuality: 0.72,
          fileType: typeCheck.mime === "image/png" ? "image/png" : undefined,
        });
      }
    } catch (err) {
      console.error("Image compression failed:", err);
      return {
        ok: false,
        error: "Could not process this image. Try another photo.",
      };
    }
  }

  const validation = validateImageUploadFile(processed, preset.maxBytes);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  return { ok: true, file: processed };
}

/**
 * @param {File} file
 * @param {{ url: string; preset?: ImageUploadPreset; onPhase?: (phase: 'compressing' | 'uploading') => void }} options
 */
export async function uploadImageWithCompression(file, { url, preset = "default", onPhase, extraFormFields }) {
  onPhase?.("compressing");
  const prep = await prepareImageForUpload(file, preset);
  if (!prep.ok) {
    return { success: false, error: prep.error };
  }

  onPhase?.("uploading");
  try {
    const fd = new FormData();
    fd.append("image", prep.file);
    if (extraFormFields && typeof extraFormFields === "object") {
      for (const [key, val] of Object.entries(extraFormFields)) {
        if (val != null) fd.append(key, String(val));
      }
    }
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: fd,
    });
    let data;
    try {
      data = await res.json();
    } catch {
      return { success: false, error: res.ok ? "Invalid server response." : `Upload failed (${res.status}).` };
    }
    if (!res.ok && data?.success !== false) {
      return { success: false, error: data?.error ?? `Upload failed (${res.status}).` };
    }
    return data;
  } catch {
    return { success: false, error: "Network error while uploading." };
  }
}

export function imageUploadStatusLabel(phase) {
  if (phase === "compressing") return "Compressing…";
  if (phase === "uploading") return "Uploading…";
  return null;
}
