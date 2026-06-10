"use client";

import { BHOJDESK_LOGOS, BHOJDESK_PLATFORM_UI } from "@/config/bhojdeskBrand";
import { useCustomerBrandLogos } from "@/hooks/useCustomerBrandLogos";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { UtensilsCrossed } from "lucide-react";

/** Full brand image — fixed height scales wide assets (navbar/footer). */
const BRAND_MARK = {
  xs: "ct-brand-logo ct-brand-logo--xs",
  sm: "ct-brand-logo ct-brand-logo--sm",
  md: "ct-brand-logo ct-brand-logo--md",
  lg: "ct-brand-logo ct-brand-logo--lg",
};

const ICON_BOX = {
  xs: { box: "size-8", img: "size-6", icon: "size-4" },
  sm: { box: "size-9", img: "size-7", icon: "size-5" },
  md: { box: "size-10", img: "size-8", icon: "size-5" },
  lg: { box: "size-16", img: "size-14", icon: "size-8" },
};

/**
 * Customer site brand — full logo image by default; BhojDesk when tenant has not set one.
 */
export default function RestaurantLogo({
  size = "sm",
  className = "",
  boxClassName = "",
  logoUrl: logoOverride,
  logoDarkUrl: logoDarkOverride,
  name: nameOverride,
  variant = "brand",
  mode = "light",
  showName: showNameProp,
  imageOnly: imageOnlyProp,
}) {
  const brand = useCustomerBrandLogos();
  const showName = showNameProp ?? brand.showBrandText;
  const imageOnly = imageOnlyProp ?? (variant !== "icon" && !showName);

  const lightSrc = normalizeLogoSrc(logoOverride ?? brand.logoUrl);
  const darkSrc = normalizeLogoSrc(logoDarkOverride ?? brand.logoDarkUrl);
  const fallbackFull =
    mode === "dark" ? BHOJDESK_LOGOS.horizontalDark : BHOJDESK_LOGOS.horizontalLight;
  const fallbackIcon = BHOJDESK_LOGOS.icon;
  const resolved = mode === "dark" ? darkSrc || lightSrc : lightSrc || darkSrc;
  const src = resolved || (imageOnly ? fallbackFull : fallbackIcon);
  const name = nameOverride ?? brand.alt;
  const iconBox = ICON_BOX[size] ?? ICON_BOX.sm;
  const brandClass = BRAND_MARK[size] ?? BRAND_MARK.sm;

  if (imageOnly) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`${brandClass} ${className}`.trim()}
        decoding="async"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  const boxStyles = src
    ? "bg-[var(--customer-card)] ring-1 ring-[var(--customer-border)]"
    : variant === "footer"
      ? "gradient-primary"
      : "gradient-primary";

  return (
    <span className={`inline-flex min-w-0 max-w-full items-center gap-1.5 sm:gap-2 ${className}`.trim()}>
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-xl ${boxStyles} ${iconBox.box} ${boxClassName}`}
        aria-hidden={!src && !showName}
      >
        {src && src !== fallbackFull ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name}
            className={`${iconBox.img} rounded-lg object-contain p-0.5`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : src === fallbackFull ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackIcon}
            alt={name || BHOJDESK_PLATFORM_UI.name}
            className={`${iconBox.img} rounded-lg object-contain p-0.5`}
          />
        ) : (
          <UtensilsCrossed className={`${iconBox.icon} text-white`} aria-hidden />
        )}
      </span>
      {showName && (
        <span className="min-w-0 truncate font-poppins text-sm font-bold tracking-tight text-customer-text sm:text-base lg:text-lg">
          {name}
        </span>
      )}
    </span>
  );
}
