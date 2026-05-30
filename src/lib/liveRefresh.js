/** Browser event — fired when inbox detects new messages/notifications. */
export const LIVE_REFRESH_EVENT = "rms:live-refresh";

/** Default polling interval for operational pages (10 seconds). */
export const LIVE_REFRESH_INTERVAL_MS = 10_000;

export function dispatchLiveRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LIVE_REFRESH_EVENT));
}
