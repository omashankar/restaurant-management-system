"use client";

import { ITEM_TYPE_META } from "@/types/menu";
import { Zap } from "lucide-react";

/** Uniform icon box for filter chips (POS, customer menu, admin filters). */
export const ITEM_TYPE_CHIP_ICON_SIZE = 14;

function IconBox({ size, className = "", children }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center leading-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {children}
    </span>
  );
}

function FssaiDotIcon({ borderColor, dotColor, size }) {
  const dotR = Math.max(1.5, (size - 6) / 2);
  const cx = size / 2;
  const cy = size / 2;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x={1}
        y={1}
        width={size - 2}
        height={size - 2}
        rx={1}
        stroke={borderColor}
        strokeWidth={2}
        fill="white"
      />
      <circle cx={cx} cy={cy} r={dotR} fill={dotColor} />
    </svg>
  );
}

/**
 * Veg / non-veg / egg / drink / halal — same visual size in pill filters.
 * @param {{ type: string; size?: number; className?: string }} props
 */
export default function ItemTypeChipIcon({
  type,
  size = ITEM_TYPE_CHIP_ICON_SIZE,
  className = "",
}) {
  if (!type || type === "all" || type === "other") return null;

  if (type === "veg") {
    return (
      <IconBox size={size} className={className}>
        <FssaiDotIcon borderColor="#16a34a" dotColor="#16a34a" size={size} />
      </IconBox>
    );
  }
  if (type === "non-veg") {
    return (
      <IconBox size={size} className={className}>
        <FssaiDotIcon borderColor="#92400e" dotColor="#92400e" size={size} />
      </IconBox>
    );
  }

  const emoji = ITEM_TYPE_META[type]?.emoji;
  if (emoji) {
    const emojiSize = Math.round(size * 0.88);
    return (
      <IconBox size={size} className={className}>
        <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{emoji}</span>
      </IconBox>
    );
  }

  return null;
}

/** Icon + label row for food-type filters (same icons as menu cards). */
export function ItemTypeFilterLabel({
  type,
  allTypesLabel = "All types",
  size = ITEM_TYPE_CHIP_ICON_SIZE,
  className = "",
}) {
  if (type === "all") {
    return <span className={className}>{allTypesLabel}</span>;
  }

  const meta = ITEM_TYPE_META[type];
  const label = meta?.label ?? type;
  const icon = <ItemTypeChipIcon type={type} size={size} />;

  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${className}`}>
      {icon}
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Lightning icon for “Fast (&lt;10 min)” — matches chip icon height. */
export function FastFilterChipIcon({
  size = ITEM_TYPE_CHIP_ICON_SIZE,
  className = "",
}) {
  const iconSize = Math.round(size * 0.78);
  return (
    <IconBox size={size} className={className}>
      <Zap style={{ width: iconSize, height: iconSize }} strokeWidth={2.25} aria-hidden />
    </IconBox>
  );
}
