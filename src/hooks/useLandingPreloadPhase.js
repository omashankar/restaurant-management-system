"use client";

import { useUser } from "@/context/AuthContext";
import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 400;
const MAX_VISIBLE_MS = 6500;
const FADE_MS = 400;
const DOM_READY_CAP_MS = 900;

export function releaseLandingPreloadPending() {
  if (typeof document === "undefined") return;
  document.documentElement.classList.remove("landing-preload-pending");
  document.documentElement.removeAttribute("data-landing-shell");
  document.body.style.removeProperty("overflow");
}

/**
 * @returns {"loading"|"fading"|"hidden"}
 */
export function useLandingPreloadPhase() {
  const { hydrated } = useUser();
  const mountedAt = useRef(Date.now());
  const [domReady, setDomReady] = useState(false);
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    document.documentElement.classList.add("landing-preload-pending");
    return () => releaseLandingPreloadPending();
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    if (document.readyState !== "loading") {
      setDomReady(true);
      return undefined;
    }

    const onReady = () => setDomReady(true);
    document.addEventListener("DOMContentLoaded", onReady);
    const cap = setTimeout(() => setDomReady(true), DOM_READY_CAP_MS);

    return () => {
      document.removeEventListener("DOMContentLoaded", onReady);
      clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    const force = setTimeout(() => {
      setPhase("hidden");
      releaseLandingPreloadPending();
    }, MAX_VISIBLE_MS);
    return () => clearTimeout(force);
  }, []);

  const shellReady = hydrated && domReady;

  useEffect(() => {
    if (!shellReady || phase !== "loading") return undefined;

    const elapsed = Date.now() - mountedAt.current;
    const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const fadeTimer = setTimeout(() => {
      releaseLandingPreloadPending();
      setPhase("fading");
    }, wait);

    const hideTimer = setTimeout(() => {
      setPhase("hidden");
      releaseLandingPreloadPending();
    }, wait + FADE_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [shellReady, phase]);

  useEffect(() => {
    if (phase === "hidden") {
      releaseLandingPreloadPending();
      return undefined;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [phase]);

  return phase;
}

export { FADE_MS };
