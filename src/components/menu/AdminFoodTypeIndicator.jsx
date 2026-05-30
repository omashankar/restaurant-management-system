"use client";

import ItemTypeChipIcon from "@/components/menu/ItemTypeChipIcon";

/**
 * Food type indicator for admin menu cards — shown before item name.
 * @param {{ type: string; size?: number }} props
 */
export default function AdminFoodTypeIndicator({ type, size = 14 }) {
  return <ItemTypeChipIcon type={type} size={size} />;
}
