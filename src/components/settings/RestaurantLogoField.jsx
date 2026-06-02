"use client";

import {
  imageUploadStatusLabel,
  uploadImageWithCompression,
} from "@/lib/clientImageUpload";
import { validateImageFileType } from "@/lib/uploadImageShared";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const inputCls =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950/60 px-3 py-2.5 text-sm text-zinc-100 outline-none focus-ra-primary placeholder:text-zinc-600";

export default function RestaurantLogoField({ logoUrl, onChange, disabled, hint }) {
  const fileRef = useRef(null);
  const [phase, setPhase] = useState(null);
  const [error, setError] = useState("");

  const busy = phase !== null;
  const statusLabel = imageUploadStatusLabel(phase);

  const previewSrc = logoUrl?.trim()
    ? logoUrl.startsWith("http") || logoUrl.startsWith("/")
      ? logoUrl
      : `/${logoUrl.replace(/^\//, "")}`
    : null;

  async function handleFile(file) {
    if (!file) return;

    const typeCheck = validateImageFileType(file);
    if (!typeCheck.ok) {
      setError(typeCheck.error);
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setError("");
    setPhase("compressing");

    const data = await uploadImageWithCompression(file, {
      url: "/api/uploads/restaurant-logo",
      preset: "logo",
      onPhase: setPhase,
    });

    setPhase(null);
    if (fileRef.current) fileRef.current.value = "";

    if (!data.success) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    onChange(data.logoUrl);
  }

  return (
    <div className="md:col-span-2 space-y-3">
      <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">
        Restaurant logo
      </label>
      <p className="text-xs text-zinc-600">
        {hint ??
          "Fallback only if Customer Site → Website layout → Header has no logo. Prefer uploading logos there (full wordmark image)."}
      </p>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:flex-row sm:items-start">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="Logo preview" className="max-h-full max-w-full object-contain p-2" />
          ) : (
            <ImageIcon className="size-10 text-zinc-600" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-200 hover-border-ra-primary-40 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin text-ra-primary" />
              ) : (
                <Upload className="size-4 text-ra-primary" />
              )}
              {statusLabel ?? "Upload logo"}
            </button>
            {logoUrl && (
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => onChange("")}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-red-500/40 hover:text-red-400 disabled:opacity-50"
              >
                <Trash2 className="size-4" /> Remove
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
            <p className="mb-1.5 text-xs text-zinc-500">Or paste image URL</p>
            <input
              type="text"
              value={logoUrl ?? ""}
              disabled={disabled || busy}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://yoursite.com/logo.png"
              className={inputCls}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <p className="text-[11px] text-zinc-600">Large logos are compressed automatically</p>
        </div>
      </div>
    </div>
  );
}
