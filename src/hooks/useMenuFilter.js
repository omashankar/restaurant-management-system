"use client";

import { useMemo, useState } from "react";

/**
 * Filters a menu item list by category, itemType, kitchenType,
 * search query, and optional fast-items toggle.
 *
 * @param {import("@/types/menu").MenuItem[]} items
 */
export function useMenuFilter(items) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeItemType, setActiveItemType] = useState("all");
  const [activeKitchen, setActiveKitchen] = useState("all");
  const [fastOnly, setFastOnly] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (activeItemType !== "all" && item.itemType !== activeItemType) return false;
      if (activeKitchen !== "all" && item.kitchenType !== activeKitchen) return false;
      if (fastOnly && (item.prepTime ?? 99) >= 10) return false;
      if (q && !`${item.name} ${item.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, activeCategory, activeItemType, activeKitchen, fastOnly, search]);

  return {
    filtered,
    activeCategory, setActiveCategory,
    activeItemType, setActiveItemType,
    activeKitchen,  setActiveKitchen,
    fastOnly,       setFastOnly,
    search,         setSearch,
  };
}
