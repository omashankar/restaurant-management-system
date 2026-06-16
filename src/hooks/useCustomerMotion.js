"use client";

import { customerMotion } from "@/lib/customerDesignSystem";
import { useReducedMotion } from "framer-motion";

/** Respects prefers-reduced-motion for Framer hover/tap/page props. */
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
      pageTransition: { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } },
      overlayFade: { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } },
      drawerSlide: { initial: false, animate: { x: 0 }, exit: { x: 0 } },
      sectionFade: { initial: false, animate: { opacity: 1, y: 0 } },
      scrollReveal: {},
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
    pageTransition: {
      initial: { opacity: 0, y: 6 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    overlayFade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.2 },
    },
    drawerSlide: {
      initial: { x: "100%" },
      animate: { x: 0 },
      exit: { x: "100%" },
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    sectionFade: {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -8 },
      transition: { duration: 0.2 },
    },
    scrollReveal: {
      variants: customerMotion.fadeUp,
      initial: "hidden",
      whileInView: "show",
      viewport: { once: true, amount: 0.2 },
    },
  };
}
