import { BHOJDESK_BRAND, BHOJDESK_LOGOS } from "@/config/bhojdeskBrand";

const VARIANT_SRC = {
  icon: BHOJDESK_LOGOS.icon,
  horizontalLight: BHOJDESK_LOGOS.horizontalLight,
  horizontalDark: BHOJDESK_LOGOS.horizontalDark,
  vertical: BHOJDESK_LOGOS.vertical,
  lockupDarkBg: BHOJDESK_LOGOS.lockupDarkBg,
};

/**
 * BhojDesk logo — pick variant for light/dark surfaces.
 * @param {"icon"|"horizontalLight"|"horizontalDark"|"vertical"|"lockupDarkBg"} variant
 */
export default function BhojDeskLogo({
  variant = "horizontalLight",
  alt,
  className = "",
  height = 36,
  width,
  priority = false,
}) {
  const src = VARIANT_SRC[variant] ?? VARIANT_SRC.horizontalLight;
  const useFixedHeight = height != null && Number.isFinite(Number(height));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? BHOJDESK_BRAND.name}
      height={useFixedHeight ? height : undefined}
      width={width}
      className={`block object-contain object-left ${className}`}
      style={
        useFixedHeight
          ? {
              height,
              width: width ?? "auto",
              maxHeight: height,
            }
          : undefined
      }
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
