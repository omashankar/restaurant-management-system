"use client";

import { adminSurface } from "@/config/adminSurfaceClasses";
import { saInputCls } from "@/config/superAdminTheme";
import { useToast } from "@/hooks/useToast";
import {
  imageUploadStatusLabel,
  uploadImageWithCompression,
} from "@/lib/clientImageUpload";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { validateImageFileType } from "@/lib/uploadImageShared";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

const UPLOAD_URL = "/api/uploads/platform-branding";

/**
 * Logo or favicon field with file upload + URL paste (Super Admin → App settings).
 */
export default function PlatformBrandingImageField({
  label,
  hint,
  error,
  value = "",
  onChange,
  disabled = false,
  kind = "logo",
  previewClassName = "max-h-full max-w-full object-contain p-2",
  previewBoxClassName = "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border admin-shell-border bg-[var(--admin-control)]",
}) {
  const { showToast } = useToast();
  const fileRef = useRef(null);
  const [phase, setPhase] = useState(null);
  const [uploadError, setUploadError] = useState("");

  const busy = phase !== null;
  const statusLabel = imageUploadStatusLabel(phase);
  const previewSrc = normalizeLogoSrc(value);
  const preset = kind === "favicon" ? "favicon" : "logo";
  const previewBox =
    kind === "favicon" ? "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border admin-shell-border bg-[var(--admin-control)]" : previewBoxClassName;

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
      url: UPLOAD_URL,
      preset,
      onPhase: setPhase,
      extraFormFields: { kind },
    });

    setPhase(null);
    if (fileRef.current) fileRef.current.value = "";

    if (!data.success) {
      setUploadError(data.error ?? "Upload failed.");
      return;
    }

    const url = String(data.imageUrl ?? "").trim();
    if (!url) {
      setUploadError("Upload succeeded but no image URL was returned.");
      return;
    }

    setUploadError("");
    onChange(url);
    showToast("Image uploaded. Click Save Changes to apply site-wide.", "success");
  }

  return (
    <div className="min-w-0 space-y-2">
      <label className={`block ${adminSurface.label}`}>{label}</label>
      {hint ? <p className={`text-[11px] ${adminSurface.faint}`}>{hint}</p> : null}

      <div className="flex min-w-0 flex-col gap-3 rounded-xl admin-surface-card p-3 sm:flex-row sm:items-start sm:p-4">
        <div className={previewBox}>
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewSrc} alt="" className={previewClassName} />
          ) : (
            <ImageIcon className="size-8 admin-surface-faint opacity-60" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => fileRef.current?.click()}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border admin-shell-border bg-[var(--admin-control)] px-3 py-2 text-sm font-medium admin-shell-text transition-colors hover-border-sa-primary-40 disabled:opacity-50 sm:w-auto"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin text-sa-primary" />
              ) : (
                <Upload className="size-4 text-sa-primary" />
              )}
              {statusLabel ?? "Upload image"}
            </button>
            {value ? (
              <button
                type="button"
                disabled={disabled || busy}
                onClick={() => onChange("")}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border admin-shell-border px-3 py-2 text-sm admin-surface-muted transition-colors hover-border-red-40 hover-bg-red-10 hover-red-danger disabled:opacity-50 sm:w-auto"
              >
                <Trash2 className="size-4" /> Remove
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
            <p className={`mb-1.5 text-[11px] ${adminSurface.faint}`}>Or paste image URL</p>
            <input
              type="text"
              value={value ?? ""}
              disabled={disabled || busy}
              onChange={(e) => onChange(e.target.value)}
              placeholder={
                kind === "favicon"
                  ? "https://cdn.example.com/favicon.png"
                  : "https://cdn.example.com/logo.png"
              }
              className={saInputCls}
            />
          </div>

          {(uploadError || error) && (
            <p className="text-xs text-red-400">{uploadError || error}</p>
          )}

          <p className={`text-[11px] ${adminSurface.faint}`}>
            JPG, PNG, or WebP — large files are compressed automatically
          </p>
        </div>
      </div>
    </div>
  );
}
