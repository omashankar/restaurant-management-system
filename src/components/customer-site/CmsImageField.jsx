"use client";

import { CMS_EDITOR_WELL, CMS_HINT, CMS_LABEL } from "@/config/customerSiteEditorClasses";
import {
  imageUploadStatusLabel,
  uploadImageWithCompression,
} from "@/lib/clientImageUpload";
import { validateImageFileType } from "@/lib/uploadImageShared";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const inputCls =
  "admin-surface-input focus-ra-primary w-full px-3 py-2.5 text-sm outline-none placeholder:admin-surface-faint";

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
  const [phase, setPhase] = useState(null);
  const [error, setError] = useState("");

  const busy = phase !== null;
  const statusLabel = imageUploadStatusLabel(phase);
  const previewSrc = normalizeLogoSrc(value);

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
      url: "/api/uploads/cms-image",
      preset: "default",
      onPhase: setPhase,
    });

    setPhase(null);
    if (fileRef.current) fileRef.current.value = "";

    if (!data.success) {
      setError(data.error ?? "Upload failed.");
      return;
    }
    onChange(data.imageUrl);
  }

  return (
    <div className="min-w-0 space-y-2">
      {label ? <label className={CMS_LABEL}>{label}</label> : null}
      {hint ? <p className="text-[11px] leading-snug admin-surface-faint">{hint}</p> : null}

      <div className={`${CMS_EDITOR_WELL} space-y-3`}>
        <div className="cms-preview-frame">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className={previewClassName} />
          ) : (
            <div className="flex h-28 items-center justify-center admin-surface-faint">
              <ImageIcon className="size-10 opacity-50" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--admin-border-subtle)] bg-[var(--admin-control)] px-3 py-2 text-xs font-medium admin-shell-text transition-colors hover:border-ra-primary-40 hover:bg-[var(--admin-hover)] disabled:opacity-50 sm:w-auto"
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin text-ra-primary" />
            ) : (
              <Upload className="size-3.5 text-ra-primary" />
            )}
            {statusLabel ?? "Upload image"}
          </button>
          {value ? (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--admin-border-subtle)] bg-[var(--admin-surface)] px-3 py-2 text-xs admin-surface-muted transition-colors hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Remove
            </button>
          ) : null}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div>
          <p className="mb-1 text-[11px] admin-surface-faint">Or paste image URL</p>
          <input
            type="text"
            value={value ?? ""}
            disabled={disabled || busy}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… or /uploads/cms-images/…"
            className={inputCls}
          />
        </div>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <p className="text-[11px] admin-surface-faint">
          JPG, PNG, or WebP — large photos are compressed automatically
        </p>
      </div>
    </div>
  );
}
