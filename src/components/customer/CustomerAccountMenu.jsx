"use client";

import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import CustomerProfileAvatar from "@/components/customer/CustomerProfileAvatar";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronDown, LogOut, Receipt, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function customerGreeting(user) {
  if (!user) return "there";
  if (user.name?.trim()) {
    const parts = user.name.trim().split(/\s+/);
    const label = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
    return label.length > 14 ? `${label.slice(0, 13)}…` : label;
  }
  if (user.email) {
    const local = user.email.split("@")[0];
    return local.length > 12 ? `${local.slice(0, 11)}…` : local;
  }
  if (user.phone) return user.phone.slice(-4).padStart(8, "•");
  return "there";
}

function displayAccountName(user) {
  if (!user) return "Customer";
  if (user.name?.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0];
  return user.phone || "Customer";
}

const ACCOUNT_LINKS = [
  { path: "/account/dashboard", label: "Profile", icon: UserRound },
  { path: "/account/dashboard?section=orders", label: "My Orders", icon: ShoppingBag },
  { path: "/account/dashboard?section=reservations", label: "Reservations", icon: Calendar },
  { path: "/account/dashboard?section=transactions", label: "Wallet & Rewards", icon: Receipt },
];

export function CustomerAccountLinks({ onNavigate, className = "" }) {
  const { logoutCustomer } = useCustomer();
  const { link } = useRestaurantSlug();
  const router = useRouter();

  const handleLogout = async () => {
    onNavigate?.();
    await logoutCustomer();
    router.push(link("/account/login"));
  };

  return (
    <div className={className}>
      {ACCOUNT_LINKS.map(({ path, label, icon: Icon }) => (
        <Link
          key={path}
          href={link(path)}
          onClick={() => onNavigate?.()}
          className="flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-[var(--customer-nav-muted)] transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-primary"
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
      <button
        type="button"
        onClick={handleLogout}
        className="flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/8"
      >
        <LogOut className="size-4 shrink-0" />
        Logout
      </button>
    </div>
  );
}

/** Compact profile row for mobile drawer header */
export function CustomerAccountMobileHeader({ user, onNavigate, className = "" }) {
  const { link } = useRestaurantSlug();
  if (!user) return null;

  return (
    <Link
      href={link("/account/dashboard")}
      onClick={() => onNavigate?.()}
      className={`ct-account-mobile-user flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--customer-primary-soft)] ${className}`}
    >
      <CustomerProfileAvatar
        name={displayAccountName(user)}
        avatarUrl={user.avatarUrl}
        size="md"
        ringClassName="ring-2 ring-customer-primary/30"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-customer-text">{displayAccountName(user)}</p>
        <p className="truncate text-xs text-customer-muted">
          {user.phone || user.email || "View profile"}
        </p>
      </div>
      <ChevronDown className="size-4 shrink-0 -rotate-90 text-customer-muted" aria-hidden />
    </Link>
  );
}

export default function CustomerAccountMenu({ className = "", onNavigate }) {
  const { authUser, logoutCustomer } = useCustomer();
  const { link } = useRestaurantSlug();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) close();
    };
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!authUser) return null;

  const fullName = displayAccountName(authUser);
  const subline = authUser.phone || authUser.email || "";

  const handleLogout = async () => {
    close();
    onNavigate?.();
    await logoutCustomer();
    router.push(link("/account/login"));
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`ct-account-nav-trigger ${open ? "ct-account-nav-trigger--open" : ""}`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${fullName}`}
      >
        <CustomerProfileAvatar
          name={fullName}
          avatarUrl={authUser.avatarUrl}
          size="nav"
          ringClassName="ring-2 ring-customer-primary/30"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="ct-elevation-overlay absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[min(100vw-1.5rem,16rem)] overflow-hidden rounded-2xl border border-[var(--customer-border)] bg-[var(--customer-card)] py-1.5 shadow-lg"
            role="menu"
          >
            <Link
              href={link("/account/dashboard")}
              role="menuitem"
              onClick={() => {
                close();
                onNavigate?.();
              }}
              className="ct-account-dropdown-profile mx-1.5 mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--customer-primary-soft)]"
            >
              <CustomerProfileAvatar
                name={fullName}
                avatarUrl={authUser.avatarUrl}
                size="md"
                ringClassName="ring-2 ring-customer-primary/30"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-customer-text">{fullName}</p>
                {subline ? (
                  <p className="truncate text-xs text-customer-muted">{subline}</p>
                ) : (
                  <p className="text-xs font-medium text-customer-primary">Edit profile</p>
                )}
              </div>
            </Link>

            <div className="mx-3 my-1 h-px bg-[var(--customer-border)]" />

            {ACCOUNT_LINKS.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                href={link(path)}
                role="menuitem"
                onClick={() => {
                  close();
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[var(--customer-nav-muted)] transition-colors hover:bg-[var(--customer-primary-soft)] hover:text-customer-primary"
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            ))}
            <div className="mx-3 my-1.5 h-px bg-[var(--customer-border)]" />
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/8"
            >
              <LogOut className="size-4 shrink-0" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
