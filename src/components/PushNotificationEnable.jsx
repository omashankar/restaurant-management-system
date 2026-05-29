"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushNotificationEnable({ vapidPublicKey }) {
  const [status, setStatus] = useState("");

  const enable = async () => {
    setStatus("");
    if (!vapidPublicKey?.trim()) {
      setStatus("Add VAPID public key in settings and save first.");
      return;
    }
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("Push not supported in this browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("Permission denied.");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js").catch(() => null);
      const sub = await (reg ?? navigator.serviceWorker.ready).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
      const data = await res.json();
      setStatus(data.success ? "Push enabled for this browser." : data.error ?? "Failed.");
    } catch (err) {
      setStatus(err?.message ?? "Failed to enable push.");
    }
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <button
        type="button"
        onClick={enable}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"
      >
        <Bell className="size-3.5" />
        Enable browser push on this device
      </button>
      {status ? <p className="mt-2 text-xs text-zinc-400">{status}</p> : null}
    </div>
  );
}
