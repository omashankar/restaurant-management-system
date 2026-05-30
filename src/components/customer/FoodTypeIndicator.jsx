"use client";

import ItemTypeChipIcon from "@/components/menu/ItemTypeChipIcon";

/**
 * Food type indicator on menu cards (customer site).
 * @param {{ type: string; size?: number; className?: string }} props
 */
export default function FoodTypeIndicator({ type, size = 16, className = "" }) {
  const icon = <ItemTypeChipIcon type={type} size={size} className={className} />;
  if (!icon) return null;

  const label = type === "non-veg" ? "Non-Veg" : type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      title={label}
      aria-label={label}
    >
      {icon}
    </span>
  );
}
