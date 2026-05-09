"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useInbox() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState({ messages: 0, notifications: 0 });
  const previousUnreadRef = useRef({ messages: 0, notifications: 0 });

  const playNotificationTone = useCallback(() => {
    if (typeof window === "undefined") return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      osc.onended = () => {
        ctx.close().catch(() => {});
      };
    } catch {
      // silent fail if browser blocks autoplay audio
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/inbox", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.success) return;
      const nextUnread = {
        messages: Number(data.unread?.messages ?? 0),
        notifications: Number(data.unread?.notifications ?? 0),
      };
      const prevUnread = previousUnreadRef.current;
      if (
        nextUnread.messages + nextUnread.notifications >
        prevUnread.messages + prevUnread.notifications
      ) {
        playNotificationTone();
      }
      previousUnreadRef.current = nextUnread;
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnread(nextUnread);
    } catch {
      // ignore transient errors
    } finally {
      setLoading(false);
    }
  }, [playNotificationTone]);

  useEffect(() => {
    refresh();
    const t = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      refresh();
    }, 10000);

    const onFocus = () => refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus);
    }

    return () => {
      clearInterval(t);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus);
      }
    };
  }, [refresh]);

  const markRead = useCallback(async (keys) => {
    const safeKeys = (Array.isArray(keys) ? keys : [keys]).filter(Boolean);
    if (!safeKeys.length) return;
    await fetch("/api/inbox/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keys: safeKeys }),
    }).catch(() => null);

    setMessages((prev) =>
      prev.map((item) => (safeKeys.includes(item.key) ? { ...item, read: true } : item))
    );
    setNotifications((prev) =>
      prev.map((item) => (safeKeys.includes(item.key) ? { ...item, read: true } : item))
    );
    setUnread((prev) => {
      const nextMessages = Math.max(
        0,
        messages.filter((m) => !m.read && safeKeys.includes(m.key)).length
      );
      const nextNotifications = Math.max(
        0,
        notifications.filter((n) => !n.read && safeKeys.includes(n.key)).length
      );
      return {
        messages: Math.max(0, prev.messages - nextMessages),
        notifications: Math.max(0, prev.notifications - nextNotifications),
      };
    });
  }, [messages, notifications]);

  const markAllRead = useCallback(async (kind) => {
    const keys = kind === "messages"
      ? messages.filter((m) => !m.read).map((m) => m.key)
      : notifications.filter((n) => !n.read).map((n) => n.key);
    if (!keys.length) return;
    await markRead(keys);
  }, [markRead, messages, notifications]);

  const resolveMessage = useCallback(async (key) => {
    const safeKey = String(key ?? "").trim();
    if (!safeKey) return false;
    const res = await fetch("/api/inbox/resolve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: safeKey }),
    }).catch(() => null);
    if (!res) return false;
    const data = await res.json().catch(() => ({ success: false }));
    if (!res.ok || !data?.success) return false;

    setMessages((prev) => prev.filter((item) => item.key !== safeKey));
    setUnread((prev) => ({
      ...prev,
      messages: Math.max(0, prev.messages - 1),
    }));
    return true;
  }, []);

  return {
    loading,
    messages,
    notifications,
    unread,
    refresh,
    markRead,
    markAllRead,
    resolveMessage,
  };
}
