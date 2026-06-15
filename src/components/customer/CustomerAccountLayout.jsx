"use client";

import { customerGreeting } from "@/components/customer/CustomerAccountMenu";
import CustomerProfileAvatar from "@/components/customer/CustomerProfileAvatar";
import { useCustomer } from "@/context/CustomerContext";
import { useRestaurantSlug } from "@/hooks/useRestaurantSlug";
import {
  Calendar,
  LogOut,
  Receipt,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export const ACCOUNT_SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "orders", label: "My Orders", icon: ShoppingBag },
  { id: "reservations", label: "My Reservations", icon: Calendar },
  { id: "transactions", label: "Wallet & Rewards", icon: Receipt },
];

export const ACCOUNT_SECTION_META = {
  profile: {
    title: "Profile",
    subtitle: "View and update your account details",
  },
  orders: {
    title: "My Orders",
    subtitle: "Track status and reorder from your history",
  },
  reservations: {
    title: "My Reservations",
    subtitle: "Table bookings linked to your account",
  },
  transactions: {
    title: "Wallet & Rewards",
    subtitle: "Your balance, loyalty points, and payment history",
  },
};

export function isAccountSection(value) {
  return ACCOUNT_SECTIONS.some((s) => s.id === value);
}

/** Map legacy ?tab= URLs to ?section= */
export function normalizeAccountSection(param) {
  if (!param) return "profile";
  if (param === "bookings") return "reservations";
  if (param === "password" || param === "favorites") return "profile";
  if (isAccountSection(param)) return param;
  return "profile";
}

export default function CustomerAccountLayout({
  activeSection = "profile",
  orderCount = 0,
  reservationCount = 0,
  children,
}) {
  const { authUser, logoutCustomer } = useCustomer();
  const { link } = useRestaurantSlug();
  const router = useRouter();
  const meta = ACCOUNT_SECTION_META[activeSection] ?? ACCOUNT_SECTION_META.profile;

  const handleLogout = async () => {
    await logoutCustomer();
    router.push(link("/account/login"));
  };

  const sectionHref = (id) => {
    const base = link("/account/dashboard");
    return id === "profile" ? base : `${base}?section=${id}`;
  };

  const navBadge = (id) => {
    if (id === "orders" && orderCount > 0) return orderCount;
    if (id === "reservations" && reservationCount > 0) return reservationCount;
    return null;
  };

  const mobileLabel = (id, label) => {
    if (id === "orders") return "Orders";
    if (id === "reservations") return "Bookings";
    if (id === "transactions") return "Rewards";
    return label;
  };

  return (
    <div className="ct-account-page">
      <div className="ct-account-shell">
        <aside className="ct-account-sidebar" aria-label="Account navigation">
          <div className="ct-account-sidebar__user">
            <CustomerProfileAvatar
              name={authUser?.name}
              avatarUrl={authUser?.avatarUrl}
              size="md"
              ringClassName="ring-2 ring-customer-primary/25"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-customer-text">
                {authUser?.name?.trim() || customerGreeting(authUser)}
              </p>
              <p className="truncate text-xs text-customer-muted">
                {authUser?.phone || authUser?.email || "Customer account"}
              </p>
            </div>
          </div>

          <nav className="ct-account-sidebar__nav">
            {ACCOUNT_SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              const badge = navBadge(id);
              return (
                <Link
                  key={id}
                  href={sectionHref(id)}
                  aria-current={active ? "page" : undefined}
                  className={`ct-account-nav-item ${active ? "ct-account-nav-item--active" : ""}`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{label}</span>
                  {badge != null ? <span className="ct-account-nav-badge">{badge}</span> : null}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="ct-account-nav-item ct-account-nav-item--logout"
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            Logout
          </button>
        </aside>

        <div className="ct-account-panel">
          <nav className="ct-account-mobile-nav" aria-label="Account sections">
            {ACCOUNT_SECTIONS.map(({ id, label, icon: Icon }) => {
              const active = activeSection === id;
              const badge = navBadge(id);
              return (
                <Link
                  key={id}
                  href={sectionHref(id)}
                  aria-current={active ? "page" : undefined}
                  className={`ct-account-mobile-tab ${active ? "ct-account-mobile-tab--active" : ""}`}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  <span>{mobileLabel(id, label)}</span>
                  {badge != null ? <span className="ct-account-mobile-tab__badge">{badge}</span> : null}
                </Link>
              );
            })}
          </nav>

          <main className="ct-account-main">
            {activeSection !== "profile" ? (
              <header className="ct-account-page-header">
                <h1 className="ct-account-page-header__title">{meta.title}</h1>
                <p className="ct-account-page-header__sub">{meta.subtitle}</p>
              </header>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
