"use client";

import { customerMotion } from "@/lib/customerDesignSystem";
import { useReducedMotion } from "framer-motion";

/** Respects prefers-reduced-motion for Framer hover/tap props. */
export function useCustomerMotion() {
  const reduce = useReducedMotion();

  if (reduce) {
    return {
      reduce: true,
      hoverLift: undefined,
      hoverLiftMd: undefined,
      hoverBtn: undefined,
      hoverNudge: undefined,
      tap: undefined,
      tapSm: undefined,
    };
  }

  return {
    reduce: false,
    hoverLift: customerMotion.cardHoverSm,
    hoverLiftMd: customerMotion.cardHover,
    hoverBtn: customerMotion.hoverBtn,
    hoverNudge: customerMotion.hoverNudge,
    tap: customerMotion.tap,
    tapSm: customerMotion.tapSm,
  };
}
