"use client";

import "@/app/super-admin/super-admin-theme.css";
import "@/app/admin-surface-theme.css";
import AdminColorModeToggle from "@/components/admin/AdminColorModeToggle";
import { AdminAvatarButton } from "@/components/admin/AdminMenu";
import { adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import SuperAdminPreloader from "./SuperAdminPreloader";
import SuperAdminSidebar from "./SuperAdminSidebar";
import ChangePasswordModal from "@/components/rms/ChangePasswordModal";
import InboxDropdown, { InboxCountBadge } from "@/components/rms/InboxDropdown";
import { useUser } from "@/context/AuthContext";
import { useInbox } from "@/hooks/useInbox";
import { useSuperAdminThemeStyles } from "@/hooks/useSuperAdminThemeStyles";
import { normalizeLogoSrc } from "@/lib/logoUrl";
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
  useSuperAdminThemeStyles();
  const { user, hydrated, loading, clearUser } = useUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeInbox, setActiveInbox] = useState(null);
  const profileRef = useRef(null);
  const inboxRef = useRef(null);
  const {
    loading: inboxLoading,
    messages,
    notifications,
    unread,
    markRead,
    markAllRead,
    resolveMessage,
  } = useInbox();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "super_admin") { router.replace("/unauthorized"); }
  }, [hydrated, user, router]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (profileRef.current?.contains(target)) return;
      if (inboxRef.current?.contains(target)) return;
      setIsProfileOpen(false);
      setActiveInbox(null);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setActiveInbox(null);
      }
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
      <div className={`super-admin-panel min-h-screen ${adminShell.page}`}>
        <SuperAdminPreloader />
      </div>
    );
  }

  if (!user || user.role !== "super_admin") return null;
  const avatarFallback = user.name?.trim()?.[0]?.toUpperCase() || "S";
  const avatarSrc = normalizeLogoSrc(user.avatarUrl);

  return (
    <div className={`super-admin-panel flex ${adminShell.layout}`}>

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
        <header className={`${adminShell.headerDesktop} admin-shell-header backdrop-blur-md`}>
          <div className="min-w-0">
            <p className={`truncate text-xs font-medium uppercase tracking-widest ${adminSurface.muted}`}>
              Super Admin Console
            </p>
            <p className={`truncate text-sm font-semibold ${adminSurface.title}`}>
              Platform control workspace
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="admin-search-wrap relative hidden lg:block">
              <Search className="admin-search-icon" strokeWidth={2} aria-hidden />
              <input
                type="text"
                placeholder="Search..."
                className={`w-56 ${adminSurface.searchCompact} focus-sa-primary`}
              />
            </div>
            <div ref={inboxRef} className="relative flex items-center gap-2">
            <AdminColorModeToggle portal="sa" />
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                setActiveInbox((prev) => (prev === "messages" ? null : "messages"));
              }}
              className={`${adminSurface.btnIcon} relative`}
              aria-label="Messages"
            >
              <MessageSquare className="size-4" />
              {unread.messages > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-sa-primary px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
                  {unread.messages}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                setActiveInbox((prev) => (prev === "notifications" ? null : "notifications"));
              }}
              className={`${adminSurface.btnIcon} relative`}
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread.notifications > 0 ? (
                <span className="absolute -right-1 -top-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
                  {unread.notifications}
                </span>
              ) : null}
            </button>
              <InboxDropdown
                open={activeInbox === "messages" && !isProfileOpen}
                type="messages"
                items={messages}
                loading={inboxLoading}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onResolveMessage={resolveMessage}
                onClose={() => setActiveInbox(null)}
                accent="sa"
              />
              <InboxDropdown
                open={activeInbox === "notifications" && !isProfileOpen}
                type="notifications"
                items={notifications}
                loading={inboxLoading}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
                onResolveMessage={resolveMessage}
                onClose={() => setActiveInbox(null)}
                accent="sa"
              />
            </div>

            <div className={`h-8 w-px ${adminShell.divider}`} aria-hidden />

            <div ref={profileRef} className="relative">
              <AdminAvatarButton
                avatarSrc={avatarSrc}
                fallback={avatarFallback}
                open={isProfileOpen}
                onClick={() => setIsProfileOpen((v) => !v)}
                label={`Open profile menu (${user.name})`}
                ringClass="ring-sa-primary-20"
              />

              <div
                className={`absolute right-0 z-[60] mt-2 origin-top-right p-1.5 ${adminSurface.dropdown} transition-all duration-150 ${
                  activeInbox ? "w-[min(360px,calc(100vw-2rem))]" : "w-[min(240px,calc(100vw-2rem))]"
                } ${
                  isProfileOpen
                    ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
                    : "pointer-events-none -translate-y-1 scale-95 opacity-0"
                }`}
                role="menu"
                aria-hidden={!isProfileOpen}
              >
                <div className="px-2.5 py-2">
                  <p className={`truncate text-sm font-medium ${adminSurface.title}`}>{user.name}</p>
                  <p className={`truncate text-xs ${adminSurface.muted}`}>Super Admin</p>
                </div>
                <div className={`mb-1 h-px ${adminShell.divider}`} />
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push("/super-admin/profile");
                  }}
                  className={adminSurface.menuItem}
                  role="menuitem"
                >
                  <User className="admin-surface-menu-item-icon size-4 shrink-0" />
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className={adminSurface.menuItem}
                  role="menuitem"
                >
                  <KeyRound className="admin-surface-menu-item-icon size-4 shrink-0" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveInbox((prev) => (prev === "messages" ? null : "messages"));
                  }}
                  className={`${adminSurface.menuItem} justify-between`}
                  role="menuitem"
                >
                  <span className="inline-flex items-center gap-2">
                    <MessageSquare className="admin-surface-menu-item-icon size-4 shrink-0" />
                    Messages
                  </span>
                  <InboxCountBadge count={unread.messages} tone="sa" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveInbox((prev) => (prev === "notifications" ? null : "notifications"));
                  }}
                  className={`${adminSurface.menuItem} justify-between`}
                  role="menuitem"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell className="admin-surface-menu-item-icon size-4 shrink-0" />
                    Notifications
                  </span>
                  <InboxCountBadge count={unread.notifications} tone="amber" />
                </button>
                {activeInbox ? (
                  <div className="mt-1 px-1">
                    <InboxDropdown
                      embedded
                      open
                      type={activeInbox}
                      items={activeInbox === "messages" ? messages : notifications}
                      loading={inboxLoading}
                      onMarkRead={markRead}
                      onMarkAllRead={markAllRead}
                      onResolveMessage={resolveMessage}
                      onClose={() => setActiveInbox(null)}
                      accent="sa"
                    />
                  </div>
                ) : null}
                <div className={`my-1 h-px ${adminShell.divider}`} />
                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
                    clearUser();
                    router.push("/login");
                  }}
                  className={`${adminSurface.menuItem} admin-surface-menu-item--danger`}
                  role="menuitem"
                >
                  <LogOut className="admin-surface-menu-item-icon size-4 shrink-0" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile topbar */}
        <header className={`${adminShell.headerCompact} admin-shell-header backdrop-blur-md md:hidden`}>
          <button type="button" onClick={() => setMobileOpen(true)}
            className={adminSurface.btnIcon}>
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-sa-primary" />
            <span className={`text-sm font-semibold ${adminSurface.title}`}>Super Admin</span>
          </div>
          <AdminColorModeToggle portal="sa" />
        </header>

        <main className={`${adminShell.pageContent} flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6`}>
          {children}
        </main>
      </div>
      <ChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        variant="sa"
      />
    </div>
  );
}
