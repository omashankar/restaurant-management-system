"use client";

import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";

/**
 * Dish photo with gradient fallback when URL missing or load fails.
 */
export default function SafeDishImage({
  src,
  alt = "",
  className = "",
  iconClassName = "size-12 text-[#FF6B35]/40",
  loading = "lazy",
}) {
  const [failed, setFailed] = useState(false);
  const url = typeof src === "string" && src.trim() ? src.trim() : "";
  if (!url || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#FFF8F3] via-[#FFE4D6]/30 to-white ${className}`}
        aria-hidden={!alt}
      >
        <UtensilsCrossed className={iconClassName} aria-hidden />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading={loading}
      decoding="async"
    />
  );
}
