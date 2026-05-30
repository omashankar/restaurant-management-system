"use client";

import { normalizeLogoSrc } from "@/lib/logoUrl";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-ra-primary placeholder:text-zinc-600";

/**
 * CMS image: upload file or paste URL (hero, about, gallery, banners).
 */
export default function CmsImageField({
  label,
  hint,
  value = "",
  onChange,
  disabled = false,
  previewClassName = "h-28 w-full object-cover",
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const previewSrc = normalizeLogoSrc(value);

  async function handleFile(file) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/uploads/cms-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      onChange(data.imageUrl);
    } catch {
      setError("Network error while uploading.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-medium text-zinc-400">{label}</label>
      )}
      {hint && <p className="text-[11px] text-zinc-600">{hint}</p>}

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 space-y-3">
        <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className={previewClassName} />
          ) : (
            <div className="flex h-28 items-center justify-center text-zinc-600">
              <ImageIcon className="size-10 opacity-50" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => fileRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-ra-primary-40 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin text-ra-primary" />
            ) : (
              <Upload className="size-3.5 text-ra-primary" />
            )}
            {uploading ? "Uploading…" : "Upload image"}
          </button>
          {value && (
            <button
              type="button"
              disabled={disabled || uploading}
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
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
            type="url"
            value={value ?? ""}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or /uploads/cms-images/…"
            className={inputCls}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
