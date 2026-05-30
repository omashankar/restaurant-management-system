"use client";

import { LIVE_REFRESH_EVENT, LIVE_REFRESH_INTERVAL_MS } from "@/lib/liveRefresh";
import { useEffect, useRef } from "react";

/**
 * Polls silently while the tab is visible, refreshes on focus/visibility,
 * and reacts instantly to {@link LIVE_REFRESH_EVENT} (e.g. new inbox alert).
 *
 * @param {(silent?: boolean) => void} callback
 * @param {{ intervalMs?: number; eventName?: string | null }} [options]
 */
export function useLiveRefresh(callback, options = {}) {
  const {
    intervalMs = LIVE_REFRESH_INTERVAL_MS,
    eventName = LIVE_REFRESH_EVENT,
  } = options;
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const runSilent = () => callbackRef.current(true);

    const id = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      runSilent();
    }, intervalMs);

    const onFocus = runSilent;
    const onVisible = () => {
      if (!document.hidden) runSilent();
    };
    const onEvent = runSilent;

    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisible);
    }
    if (eventName && typeof window !== "undefined") {
      window.addEventListener(eventName, onEvent);
    }

    return () => {
      clearInterval(id);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisible);
      }
      if (eventName && typeof window !== "undefined") {
        window.removeEventListener(eventName, onEvent);
      }
    };
  }, [intervalMs, eventName]);
}
