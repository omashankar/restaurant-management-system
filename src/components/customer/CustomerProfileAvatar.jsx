"use client";

import { uploadImageWithCompression } from "@/lib/clientImageUpload";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

const SIZES = {
  nav: { box: "size-9", text: "text-sm", btn: "size-5 -bottom-0.5 -right-0.5", icon: "size-2.5" },
  sm: { box: "size-8", text: "text-xs", btn: "size-5 -bottom-0.5 -right-0.5", icon: "size-2.5" },
  md: { box: "size-14", text: "text-lg", btn: "size-7 -bottom-0.5 -right-0.5", icon: "size-3.5" },
  lg: { box: "size-20", text: "text-2xl", btn: "size-8 -bottom-1 -right-1", icon: "size-4" },
  xl: { box: "size-24", text: "text-3xl", btn: "size-9 -bottom-1 -right-1", icon: "size-4" },
};

const BOX_PX = { nav: 36, sm: 32, md: 56, lg: 80, xl: 96 };

export default function CustomerProfileAvatar({
  name = "",
  avatarUrl = "",
  size = "lg",
  editable = false,
  className = "",
  ringClassName = "ring-2 ring-customer-primary/35",
  onUploaded,
  onError,
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const dims = SIZES[size] ?? SIZES.lg;
  const px = BOX_PX[size] ?? BOX_PX.lg;
  const src = normalizeLogoSrc(avatarUrl);
  const fallback = (name?.trim()?.[0] ?? "?").toUpperCase();

  const handleFile = async (file) => {
    if (!file || !editable) return;

    setUploading(true);
    try {
      const data = await uploadImageWithCompression(file, {
        url: "/api/customer/auth/avatar",
        preset: "avatar",
      });
      if (!data?.success) {
        onError?.(data?.error ?? "Failed to upload profile photo.");
        return;
      }
      onUploaded?.(data.user, data.avatarUrl);
    } catch {
      onError?.("Network error while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <Image
          key={src}
          src={src}
          alt=""
          width={px}
          height={px}
          className={`${dims.box} rounded-full object-cover ${ringClassName}`}
          unoptimized
        />
      ) : (
        <span
          className={`flex ${dims.box} items-center justify-center rounded-full gradient-primary ${dims.text} font-bold text-white ${ringClassName}`}
          aria-hidden
        >
          {fallback}
        </span>
      )}

      {editable ? (
        <>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className={`absolute flex cursor-pointer items-center justify-center rounded-full border-2 border-[var(--customer-card)] bg-customer-primary text-white shadow-sm transition hover:brightness-110 disabled:opacity-60 ${dims.btn}`}
            aria-label="Change profile photo"
          >
            {uploading ? (
              <Loader2 className={`${dims.icon} animate-spin`} aria-hidden />
            ) : (
              <Camera className={dims.icon} aria-hidden />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (fileRef.current) fileRef.current.value = "";
              if (file) handleFile(file);
            }}
          />
        </>
      ) : null}
    </div>
  );
}
