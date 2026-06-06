"use client";

import { useLayoutEffect, useState } from "react";

/** Fixed top/right coords for a portaled panel anchored to a trigger element. */
export function useAnchoredPortalPosition(active, anchorRef, offset = 8) {
  const [position, setPosition] = useState(null);

  useLayoutEffect(() => {
    if (!active || !anchorRef?.current) {
      setPosition(null);
      return;
    }

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + offset,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, anchorRef, offset]);

  return position;
}
