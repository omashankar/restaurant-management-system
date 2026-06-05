"use client";

import { ROLES, roleLabel, useApp } from "@/context/AppProviders";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function Navbar() {
  const { user, logout, setDemoRole } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef(null);

  const clearTimer = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    clearTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b admin-shell-border bg-zinc-950/90 px-4 backdrop-blur-md">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium uppercase tracking-widest admin-surface-muted">
          Restaurant Management System
        </p>
        <p className="truncate admin-surface-title text-sm font-semibold">
          {roleLabel(user.role)} workspace
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="relative"
          onMouseEnter={() => {
            clearTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            className="cursor-pointer flex items-center gap-2 rounded-xl border admin-shell-border bg-zinc-900/80 px-3 py-2 text-xs font-medium admin-shell-text transition-colors hover-border-ra-primary-40"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="hidden sm:inline">Demo: switch role</span>
            <span className="sm:hidden">Role</span>
            <ChevronDown
              className={`size-4 admin-surface-muted transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open ? (
            <ul
              role="listbox"
              className="absolute right-0 top-full mt-1 min-w-[180px] rounded-xl border admin-shell-border bg-zinc-900 py-1 shadow-xl shadow-black/40"
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
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--admin-hover)] ${
                      user.role === r
                        ? "text-ra-primary"
                        : "admin-surface-body"
                    }`}
                  >
                    {roleLabel(r)}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="hidden h-8 w-px bg-zinc-800 sm:block" aria-hidden />

        <div className="flex items-center gap-2 admin-surface-card py-1 pl-1 pr-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-zinc-800 admin-surface-body">
            <User className="size-4" />
          </span>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-medium admin-shell-text">
              {user.name}
            </p>
            <p className="truncate text-xs admin-surface-muted">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/login");
          }}
          className="inline-flex items-center gap-2 rounded-xl border admin-shell-border px-3 py-2 text-sm font-medium admin-surface-body transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
