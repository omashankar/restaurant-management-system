import BhojDeskLogo from "@/components/brand/BhojDeskLogo";
import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";

/**
 * Landing header/footer brand image — height capped via `.landing-brand-logo` CSS.
 * @param {"nav"|"footer"} slot
 */
export default function LandingBrandLogo({
  slot = "nav",
  src,
  alt = BHOJDESK_BRAND.name,
  variant = "horizontalLight",
  priority = false,
}) {
  const className =
    slot === "footer"
      ? "landing-brand-logo landing-brand-logo--footer"
      : "landing-brand-logo landing-brand-logo--nav";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />
    );
  }

  return (
    <BhojDeskLogo
      variant={variant}
      alt={alt}
      className={className}
      priority={priority}
    />
  );
}
