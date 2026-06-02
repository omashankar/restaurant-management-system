"use client";

import {
  imageUploadStatusLabel,
  uploadImageWithCompression,
} from "@/lib/clientImageUpload";
import { validateImageFileType } from "@/lib/uploadImageShared";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-ra-primary placeholder:text-zinc-600";

/**
 * Menu item image: upload file or paste URL.
 */
export default function MenuItemImageField({
  value = "",
  onChange,
  disabled = false,
  error = "",
}) {
  const fileRef = useRef(null);
  const [phase, setPhase] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const busy = phase !== null;
  const previewSrc = normalizeLogoSrc(value);
  const displayError = error || uploadError;
  const statusLabel = imageUploadStatusLabel(phase);

  async function handleFile(file) {
    if (!file) return;

    const typeCheck = validateImageFileType(file);
    if (!typeCheck.ok) {
      setUploadError(typeCheck.error);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploadError("");
    setPhase("compressing");

    const data = await uploadImageWithCompression(file, {
      url: "/api/uploads/menu-item-image",
      preset: "default",
      onPhase: setPhase,
    });

    setPhase(null);
    if (fileRef.current) fileRef.current.value = "";

    if (!data.success) {
      setUploadError(data.error ?? "Upload failed.");
      return;
    }
    onChange(data.imageUrl);
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-zinc-500">Item image (optional)</label>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-3">
        <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className="h-32 w-full object-cover" />
          ) : (
            <div className="flex h-32 items-center justify-center text-zinc-600">
              <ImageIcon className="size-10 opacity-50" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-ra-primary-40 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin text-ra-primary" />
            ) : (
              <Upload className="size-3.5 text-ra-primary" />
            )}
            {statusLabel ?? "Upload image"}
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange("")}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Remove
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div>
          <p className="mb-1 text-[11px] text-zinc-500">Or paste image URL</p>
          <input
            type="text"
            value={value ?? ""}
            disabled={disabled || busy}
            onChange={(e) => {
              setUploadError("");
              onChange(e.target.value);
            }}
            placeholder="https://… or /uploads/menu-items/…"
            className={`${inputCls}${displayError ? " border-red-500/50" : ""}`}
          />
        </div>
        {displayError && <p className="text-xs text-red-400">{displayError}</p>}
        <p className="text-[11px] text-zinc-600">
          JPG, PNG, or WebP — large photos are compressed automatically
        </p>
      </div>
    </div>
  );
}
