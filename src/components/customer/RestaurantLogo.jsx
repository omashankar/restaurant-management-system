"use client";

import { useCustomerBrandLogos } from "@/hooks/useCustomerBrandLogos";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { UtensilsCrossed } from "lucide-react";

const SIZES = {
  xs: { box: "size-8", img: "size-6", icon: "size-4", mark: "h-7" },
  sm: { box: "size-9", img: "size-7", icon: "size-5", mark: "h-9" },
  md: { box: "size-10", img: "size-8", icon: "size-5", mark: "h-10" },
  lg: { box: "size-16", img: "size-14", icon: "size-8", mark: "h-14" },
};

/**
 * Brand mark for customer site — image-only by default (full logo file, no HTML text).
 */
export default function RestaurantLogo({
  size = "sm",
  className = "",
  boxClassName = "",
  logoUrl: logoOverride,
  logoDarkUrl: logoDarkOverride,
  name: nameOverride,
  variant = "default",
  mode = "light",
  showName: showNameProp,
  imageOnly: imageOnlyProp,
}) {
  const brand = useCustomerBrandLogos();
  const showName = showNameProp ?? brand.showBrandText;
  const imageOnly = imageOnlyProp ?? !showName;

  const lightSrc = normalizeLogoSrc(logoOverride ?? brand.logoUrl);
  const darkSrc = normalizeLogoSrc(logoDarkOverride ?? brand.logoDarkUrl);
  const src = mode === "dark" ? darkSrc || lightSrc : lightSrc || darkSrc;
  const name = nameOverride ?? brand.alt;
  const s = SIZES[size] ?? SIZES.sm;

  if (imageOnly && src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`w-auto max-w-[min(240px,55vw)] object-contain object-left ${s.mark} ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  const boxStyles = src
    ? "bg-white ring-1 ring-[#FFE4D6] shadow-sm"
    : variant === "footer"
      ? "gradient-primary shadow-md shadow-[var(--customer-primary-shadow)]/30"
      : "gradient-primary shadow-sm shadow-[var(--customer-primary-shadow)]/20";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 ${showName && src ? "" : ""}`}
    >
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl ${boxStyles} ${s.box} ${boxClassName} ${className}`}
        aria-hidden={!src && !showName}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className={`${s.img} rounded-lg object-contain p-0.5`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <UtensilsCrossed className={`${s.icon} text-white`} />
        )}
      </span>
      {showName && (
        <span className="font-poppins text-lg font-bold tracking-tight text-customer-text">
          {name}
        </span>
      )}
    </span>
  );
}
