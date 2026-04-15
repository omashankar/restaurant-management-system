"use client";

import { ROLES, roleLabel, useApp } from "@/context/AppProviders";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  MessageSquare,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function TopNavbar({ onOpenSidebar, onToggleSidebar }) {
  const { user, logout, setDemoRole } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const closeTimer = useRef(null);
  const profileRef = useRef(null);

  const clearTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!user) return null;
  const avatarFallback = user.name?.trim()?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar ?? onOpenSidebar}
          className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 p-2 text-zinc-200 transition-colors hover:bg-zinc-900 md:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-xs font-medium uppercase tracking-widest text-zinc-500">
            Restaurant Management System
          </p>
          <p className="truncate text-sm font-semibold text-zinc-100">
            {roleLabel(user.role)} workspace
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsProfileOpen(false)}
          className="cursor-pointer relative inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
          aria-label="Messages"
        >
          <MessageSquare className="size-4" />
          <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsProfileOpen(false)}
          className="cursor-pointer relative inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 p-2 text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-100"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
            5
          </span>
        </button>

        <div
          className="relative hidden md:block"
          onMouseEnter={() => {
            clearTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-emerald-500/40"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span>Demo: switch role</span>
            <ChevronDown
              className={`size-4 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open ? (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-1 min-w-[180px] rounded-xl border border-zinc-800 bg-zinc-900 py-1 shadow-xl shadow-black/40"
            >
              {ROLES.map((r) => (
                <li key={r} role="option" aria-selected={user.role === r}>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoRole(r);
                      setOpen(false);
                      if (r === "chef") router.push("/kitchen");
                      else if (r === "waiter") router.push("/pos");
                      else router.push("/dashboard");
                    }}
                    className={`cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-zinc-800 ${
                      user.role === r ? "text-emerald-400" : "text-zinc-300"
                    }`}
                  >
                    {roleLabel(r)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="hidden h-8 w-px bg-zinc-800 md:block" aria-hidden />

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen((v) => !v)}
            className="cursor-pointer inline-flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 p-0.5 text-zinc-200 outline-none ring-emerald-500/0 transition-colors hover:border-zinc-700 hover:ring-2 hover:ring-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
            aria-label={`Open profile menu (${user.name})`}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200 ring-1 ring-zinc-700">
              {avatarFallback}
            </span>
          </button>

          <div
            className={`absolute right-0 z-[60] mt-2 w-[min(220px,calc(100vw-2rem))] origin-top-right rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-lg shadow-black/40 transition-all duration-150 ${
              isProfileOpen
                ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                : "pointer-events-none -translate-y-1 scale-95 opacity-0"
            }`}
            role="menu"
            aria-hidden={!isProfileOpen}
          >
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
              <p className="truncate text-xs text-zinc-500">{roleLabel(user.role)}</p>
            </div>

            <div className="md:hidden">
              <div className="mb-1 h-px bg-zinc-800" />
              <p className="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Demo · switch role
              </p>
              <ul className="mb-1 max-h-40 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40 py-0.5">
                {ROLES.map((r) => (
                  <li key={r}>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoRole(r);
                        setIsProfileOpen(false);
                        if (r === "chef") router.push("/kitchen");
                        else if (r === "waiter") router.push("/pos");
                        else router.push("/dashboard");
                      }}
                      className={`cursor-pointer flex w-full items-center px-2.5 py-2 text-left text-sm transition-colors hover:bg-zinc-800 ${
                        user.role === r ? "font-medium text-emerald-400" : "text-zinc-300"
                      }`}
                      role="menuitem"
                    >
                      {roleLabel(r)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-1 h-px bg-zinc-800" />
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                router.push("/profile");
              }}
              className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              role="menuitem"
            >
              <User className="size-4 text-zinc-400" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="cursor-pointer flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              role="menuitem"
            >
              <span className="inline-flex items-center gap-2">
                <MessageSquare className="size-4 text-zinc-400" />
                Messages
              </span>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                3
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="cursor-pointer flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              role="menuitem"
            >
              <span className="inline-flex items-center gap-2">
                <Bell className="size-4 text-zinc-400" />
                Notifications
              </span>
              <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
                5
              </span>
            </button>

            <div className="my-1 h-px bg-zinc-800" />

            <button
              type="button"
              onClick={async () => {
                setIsProfileOpen(false);
                await fetch("/api/auth/logout", { method: "POST" });
                logout();
                router.push("/login");
              }}
              className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-red-500/10 hover:text-red-300"
              role="menuitem"
            >
              <LogOut className="size-4 text-zinc-400" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
