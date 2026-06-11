"use client";

import "@/app/super-admin/super-admin-theme.css";
import "@/app/admin-surface-theme.css";
import AdminColorModeToggle from "@/components/admin/AdminColorModeToggle";
import { AdminAvatarButton } from "@/components/admin/AdminMenu";
import {
  adminHeaderDropdownPortal,
  adminShell,
  adminSurface,
} from "@/config/adminSurfaceClasses";
import BhojDeskLogo from "@/components/brand/BhojDeskLogo";
import SuperAdminPreloader from "./SuperAdminPreloader";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { BHOJDESK_BRAND } from "@/config/bhojdeskBrand";
import ChangePasswordModal from "@/components/rms/ChangePasswordModal";
import InboxDropdown, { HeaderInboxBadge, InboxCountBadge } from "@/components/rms/InboxDropdown";
import MobileDrawer from "@/components/rms/MobileDrawer";
import { useUser } from "@/context/AuthContext";
import { useInbox } from "@/hooks/useInbox";
import { useAnchoredPortalPosition } from "@/hooks/useAnchoredPortalPosition";
import { useSuperAdminThemeStyles } from "@/hooks/useSuperAdminThemeStyles";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  User,
} from "lucide-react";

export default function SuperAdminLayout({ children }) {
  useSuperAdminThemeStyles();
  const { user, hydrated, loading, clearUser } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeInbox, setActiveInbox] = useState(null);
  const profileBtnRef = useRef(null);
  const inboxRef = useRef(null);
  const messagesBtnRef = useRef(null);
  const notificationsBtnRef = useRef(null);
  const profileMenuPosition = useAnchoredPortalPosition(isProfileOpen, profileBtnRef);
  const [mdUp, setMdUp] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 768px)").matches;
  });
  const {
    loading: inboxLoading,
    messages,
    notifications,
    unread,
    markRead,
    markAllRead,
    resolveMessage,
  } = useInbox();

  const isHeaderDropdownTarget = (target) =>
    Boolean(
      target?.closest?.("[data-admin-header-dropdown]") ||
        profileBtnRef.current?.contains(target) ||
        inboxRef.current?.contains(target)
    );

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "super_admin") {
      router.replace("/unauthorized");
    }
  }, [hydrated, user, router]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (mdUp) setMobileOpen(false);
  }, [mdUp]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    setIsProfileOpen(false);
    setActiveInbox(null);
  }, [mobileOpen]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (isHeaderDropdownTarget(target)) return;
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
    <div className={`super-admin-panel flex min-w-0 max-w-[100vw] overflow-x-hidden ${adminShell.layout}`}>
      <div className="hidden h-full shrink-0 md:flex">
        <SuperAdminSidebar />
      </div>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <SuperAdminSidebar
          mobile
          onNavigate={() => setMobileOpen(false)}
          onClose={() => setMobileOpen(false)}
        />
      </MobileDrawer>

      <div className="flex min-w-0 max-w-full flex-1 flex-col">
        <header
          className={`${adminShell.header} admin-shell-header h-14 min-w-0 w-full max-w-full gap-2 overflow-x-hidden px-3 backdrop-blur-md sm:gap-4 sm:px-4 md:h-16`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-none sm:flex-initial sm:gap-3">
            {!mdUp ? (
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className={`${adminSurface.btnIcon} shrink-0`}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <Menu className="size-5" aria-hidden />
              </button>
            ) : null}

            {!mdUp ? (
              <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-1">
                <BhojDeskLogo variant="icon" height={28} className="shrink-0" />
                <span className={`truncate text-sm font-semibold ${adminSurface.title}`}>
                  {BHOJDESK_BRAND.shortName}
                </span>
              </div>
            ) : null}

            <div className="hidden min-w-0 md:block">
              <p className={`truncate text-xs font-medium uppercase tracking-widest ${adminSurface.muted}`}>
                Super Admin Console
              </p>
              <p className={`truncate text-sm font-semibold ${adminSurface.title}`}>
                Platform control workspace
              </p>
            </div>
          </div>

          <div className="ml-auto flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-1 sm:gap-2 lg:gap-3">
            <div className="hidden shrink-0 lg:block">
              <div className="admin-search-wrap relative">
                <Search className="admin-search-icon" strokeWidth={2} aria-hidden />
                <input
                  type="text"
                  placeholder="Search..."
                  className={`max-w-[9rem] xl:max-w-[14rem] ${adminSurface.searchCompact} focus-sa-primary`}
                />
              </div>
            </div>

            <div ref={inboxRef} className="relative hidden items-center gap-1 sm:flex sm:gap-2">
              <AdminColorModeToggle portal="sa" />
              <button
                ref={messagesBtnRef}
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setActiveInbox((prev) => (prev === "messages" ? null : "messages"));
                }}
                className={`${adminSurface.btnIcon} relative shrink-0 overflow-visible`}
                aria-label={unread.messages > 0 ? `Messages (${unread.messages} unread)` : "Messages"}
              >
                <MessageSquare className="size-4" />
                <HeaderInboxBadge count={unread.messages} tone="sa" />
              </button>
              <button
                ref={notificationsBtnRef}
                type="button"
                onClick={() => {
                  setIsProfileOpen(false);
                  setActiveInbox((prev) => (prev === "notifications" ? null : "notifications"));
                }}
                className={`${adminSurface.btnIcon} relative shrink-0 overflow-visible`}
                aria-label={
                  unread.notifications > 0
                    ? `Notifications (${unread.notifications} unread)`
                    : "Notifications"
                }
              >
                <Bell className="size-4" />
                <HeaderInboxBadge count={unread.notifications} tone="amber" />
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
                anchorRef={messagesBtnRef}
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
                anchorRef={notificationsBtnRef}
              />
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:hidden">
              <AdminColorModeToggle portal="sa" />
            </div>

            <div className={`hidden h-8 w-px shrink-0 ${adminShell.divider} md:block`} aria-hidden />

            <div ref={profileBtnRef} className="relative shrink-0">
              <AdminAvatarButton
                avatarSrc={avatarSrc}
                fallback={avatarFallback}
                open={isProfileOpen}
                onClick={() => {
                  setActiveInbox(null);
                  setIsProfileOpen((v) => !v);
                }}
                label={`Open profile menu (${user.name})`}
                ringClass="ring-sa-primary-20"
              />
            </div>

            {isProfileOpen && profileMenuPosition && typeof document !== "undefined"
              ? createPortal(
                  <div
                    data-admin-header-dropdown=""
                    className={adminHeaderDropdownPortal}
                    style={{ top: profileMenuPosition.top, right: profileMenuPosition.right }}
                  >
                    <div
                      className={`origin-top-right p-1.5 ${adminSurface.dropdown} ${
                        activeInbox ? "w-[min(360px,calc(100vw-1.5rem))]" : "w-[min(240px,calc(100vw-1.5rem))]"
                      }`}
                      role="menu"
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
                  </div>,
                  document.body
                )
              : null}
          </div>
        </header>

        <main
          className={`${adminShell.pageContent} relative z-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6`}
        >
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
