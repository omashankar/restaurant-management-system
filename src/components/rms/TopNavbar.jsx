"use client";

import { ROLES, roleLabel, useApp } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import GlobalSearch from "@/components/rms/GlobalSearch";
import AdminColorModeToggle from "@/components/admin/AdminColorModeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import ChangePasswordModal from "@/components/rms/ChangePasswordModal";
import InboxDropdown, { InboxCountBadge } from "@/components/rms/InboxDropdown";
import { useInbox } from "@/hooks/useInbox";
import { useRestaurantBranding } from "@/hooks/useRestaurantBranding";
import {
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  MessageSquare,
  User,
} from "lucide-react";
import { AdminAvatarButton } from "@/components/admin/AdminMenu";
import { adminHeaderDropdownPortal, adminShell, adminSurface } from "@/config/adminSurfaceClasses";
import { normalizeLogoSrc } from "@/lib/logoUrl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAnchoredPortalPosition } from "@/hooks/useAnchoredPortalPosition";

export default function TopNavbar({
  onOpenSidebar,
  onToggleSidebar,
  showMobileMenu = true,
  isSidebarOpen = false,
}) {
  const { user: appUser, logout, setDemoRole } = useApp();
  const { user: dbUser } = useUser();
  // Prefer DB user (has real name from MongoDB), fallback to app user
  const user = dbUser ?? appUser;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [activeInbox, setActiveInbox] = useState(null); // messages | notifications | null
  const profileBtnRef = useRef(null);
  const profileMenuPanelRef = useRef(null);
  const roleMenuPanelRef = useRef(null);
  const inboxRef = useRef(null);
  const messagesBtnRef = useRef(null);
  const notificationsBtnRef = useRef(null);
  const roleMenuBtnRef = useRef(null);
  const {
    loading: inboxLoading,
    messages,
    notifications,
    unread,
    markRead,
    markAllRead,
    resolveMessage,
  } = useInbox();
  const { name: brandName, tagline: brandTagline } = useRestaurantBranding();
  const roleMenuPosition = useAnchoredPortalPosition(open, roleMenuBtnRef);
  const profileMenuPosition = useAnchoredPortalPosition(isProfileOpen, profileBtnRef);

  const isHeaderDropdownTarget = (target) =>
    Boolean(
      target?.closest?.("[data-admin-header-dropdown]") ||
        profileBtnRef.current?.contains(target) ||
        roleMenuBtnRef.current?.contains(target) ||
        inboxRef.current?.contains(target)
    );

  useEffect(() => {
    if (!isSidebarOpen) return;
    setIsProfileOpen(false);
    setActiveInbox(null);
    setOpen(false);
  }, [isSidebarOpen]);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (isHeaderDropdownTarget(target)) return;
      setIsProfileOpen(false);
      setActiveInbox(null);
      setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
        setActiveInbox(null);
        setOpen(false);
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
  const avatarSrc = normalizeLogoSrc(user.avatarUrl);

  return (
    <header className={`${adminShell.header} min-w-0 w-full max-w-full gap-2 overflow-x-hidden px-3 sm:gap-4 sm:px-4`}>
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:max-w-none sm:flex-initial sm:gap-3">
        {showMobileMenu ? (
          <button
            type="button"
            onClick={onToggleSidebar ?? onOpenSidebar}
            className={`${adminSurface.btnIcon} shrink-0`}
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
          >
            <Menu className="size-5" aria-hidden />
          </button>
        ) : null}

        {showMobileMenu ? (
          <div className="min-w-0 flex-1 sm:hidden">
            <p className={`truncate text-sm font-semibold ${adminSurface.title}`}>
              {brandName}
            </p>
            <p className={`truncate text-[10px] ${adminSurface.muted}`}>{roleLabel(user.role)} workspace</p>
          </div>
        ) : null}

        <div className="hidden min-w-0 max-w-[14rem] lg:max-w-xs sm:block">
          <p className={`truncate text-xs font-medium uppercase tracking-widest ${adminSurface.muted}`}>
            {brandTagline}
          </p>
          <p className={`truncate text-sm font-semibold ${adminSurface.title}`}>
            {roleLabel(user.role)} workspace
          </p>
        </div>
      </div>

      <div className="ml-auto flex min-w-0 shrink-0 flex-nowrap items-center justify-end gap-1 sm:gap-2 lg:gap-3">
        {/* Global Search — desktop only (mobile: profile menu / sidebar) */}
        <div className="hidden shrink-0 lg:block">
          <GlobalSearch />
        </div>

        {/* Language — tablet+ */}
        <div className="hidden shrink-0 sm:block">
          <LanguageSwitcher compact />
        </div>

        <AdminColorModeToggle portal="ra" className="shrink-0" />

        <div ref={inboxRef} className="relative hidden shrink-0 items-center gap-1.5 sm:flex sm:gap-2">
        <button
          ref={messagesBtnRef}
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
            <span className="absolute -right-1 -top-1 rounded-full bg-ra-primary px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
              {unread.messages}
            </span>
          ) : null}
        </button>

        <button
          ref={notificationsBtnRef}
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
            anchorRef={notificationsBtnRef}
          />
        </div>

        <div className="relative hidden shrink-0 md:block">
          <button
            ref={roleMenuBtnRef}
            type="button"
            onClick={() => {
              setIsProfileOpen(false);
              setActiveInbox(null);
              setOpen((prev) => !prev);
            }}
            className={`${adminSurface.btnGhost} text-xs hover-border-ra-primary-40`}
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span>Demo: switch role</span>
            <ChevronDown
              className={`size-4 ${adminSurface.muted} transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && roleMenuPosition && typeof document !== "undefined"
            ? createPortal(
                <div
                  ref={roleMenuPanelRef}
                  data-admin-header-dropdown=""
                  className={adminHeaderDropdownPortal}
                  style={{ top: roleMenuPosition.top, right: roleMenuPosition.right }}
                >
                  <ul role="listbox" className={`min-w-[180px] py-1 ${adminSurface.dropdown}`}>
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
                          className={`cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${adminSurface.rowHover} ${
                            user.role === r ? "text-ra-primary" : adminSurface.body
                          }`}
                        >
                          {roleLabel(r)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>,
                document.body
              )
            : null}
        </div>

        <div className={`hidden h-8 w-px shrink-0 ${adminShell.divider} md:block`} aria-hidden />

        <div ref={profileBtnRef} className="relative shrink-0">
          <AdminAvatarButton
            avatarSrc={avatarSrc}
            fallback={avatarFallback}
            open={isProfileOpen}
            onClick={() => {
              setOpen(false);
              setActiveInbox(null);
              setIsProfileOpen((v) => !v);
            }}
            label={`Open profile menu (${user.name})`}
          />
        </div>

        {isProfileOpen && profileMenuPosition && typeof document !== "undefined"
          ? createPortal(
              <div
                ref={profileMenuPanelRef}
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
                  <p className={`truncate text-xs ${adminSurface.muted}`}>{roleLabel(user.role)}</p>
                </div>

                <div className="md:hidden">
                  <div className={`mb-1 h-px ${adminShell.divider}`} />
                  <p className={`mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider ${adminSurface.muted}`}>
                    Demo · switch role
                  </p>
                  <ul className="admin-surface-menu-nested mb-1 max-h-40 overflow-y-auto rounded-xl py-0.5">
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
                          className={`${adminSurface.menuItem} px-2.5 py-2 ${
                            user.role === r ? "font-medium text-ra-primary" : ""
                          }`}
                          role="menuitem"
                        >
                          {roleLabel(r)}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`mb-1 h-px ${adminShell.divider}`} />
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    router.push(user.role === "super_admin" ? "/super-admin/profile" : "/profile");
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
                  <InboxCountBadge count={unread.messages} tone="ra" />
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
                    />
                  </div>
                ) : null}

                <div className={`my-1 h-px ${adminShell.divider}`} />

                <button
                  type="button"
                  onClick={async () => {
                    setIsProfileOpen(false);
                    await fetch("/api/auth/logout", { method: "POST" });
                    logout();
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
      <ChangePasswordModal
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </header>
  );
}
