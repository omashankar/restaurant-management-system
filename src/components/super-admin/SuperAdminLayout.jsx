"use client";

import SuperAdminSidebar from "./SuperAdminSidebar";
import ChangePasswordModal from "@/components/rms/ChangePasswordModal";
import { useUser } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Shield,
  User,
} from "lucide-react";

export default function SuperAdminLayout({ children }) {
  const { user, hydrated, loading, clearUser } = useUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "super_admin") { router.replace("/unauthorized"); }
  }, [hydrated, user, router]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (loading || !hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <Shield className="size-5 animate-pulse text-rose-400" />
          Loading Super Admin…
        </div>
      </div>
    );
  }

  if (!user || user.role !== "super_admin") return null;
  const avatarFallback = user.name?.trim()?.[0]?.toUpperCase() || "S";

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex">
        <SuperAdminSidebar />
      </div>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          <button type="button" aria-label="Close menu"
            className="cursor-pointer fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 flex md:hidden">
            <SuperAdminSidebar />
          </div>
        </>
      )}

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop topbar */}
        <header className="hidden h-16 items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md md:flex">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-widest text-zinc-500">
              Super Admin Console
            </p>
            <p className="truncate text-sm font-semibold text-zinc-100">
              Platform control workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden lg:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-56 rounded-xl border border-zinc-800 bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none transition-colors placeholder:text-zinc-500 focus:border-rose-500/40"
              />
            </div>
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

            <div className="h-8 w-px bg-zinc-800" aria-hidden />

            <div ref={profileRef} className="relative">
              <button
                type="button"
                onClick={() => setIsProfileOpen((v) => !v)}
                className="cursor-pointer inline-flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/60 p-0.5 text-zinc-200 transition-colors hover:border-zinc-700"
                aria-expanded={isProfileOpen}
                aria-haspopup="menu"
                aria-label={`Open profile menu (${user.name})`}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-200 ring-1 ring-zinc-700">
                  {avatarFallback}
                </span>
              </button>

              <div
                className={`absolute right-0 z-[60] mt-2 w-[min(240px,calc(100vw-2rem))] origin-top-right rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-lg shadow-black/40 transition-all duration-150 ${
                  isProfileOpen
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                }`}
                role="menu"
                aria-hidden={!isProfileOpen}
              >
                <div className="px-2.5 py-2">
                  <p className="truncate text-sm font-medium text-zinc-100">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">Super Admin</p>
                </div>
                <div className="mb-1 h-px bg-zinc-800" />
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/super-admin/profile");
                  }}
                  className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
                  role="menuitem"
                >
                  <User className="size-4 text-zinc-400" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
                  role="menuitem"
                >
                  <KeyRound className="size-4 text-zinc-400" />
                  Change Password
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
                    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                    clearUser();
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

        {/* Mobile topbar */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-4 backdrop-blur-md md:hidden">
          <button type="button" onClick={() => setMobileOpen(true)}
            className="cursor-pointer flex size-9 items-center justify-center rounded-xl border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200">
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-rose-400" />
            <span className="text-sm font-semibold text-zinc-100">Super Admin</span>
          </div>
          <div className="size-9" /> {/* spacer */}
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {children}
        </main>
      </div>
      <ChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </div>
  );
}
