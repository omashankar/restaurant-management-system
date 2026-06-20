/** Super Admin sidebar + global search page index. */

export const SUPER_ADMIN_NAV_LINKS = [
  {
    href: "/super-admin/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    keywords: ["home", "overview", "stats", "command"],
  },
  {
    href: "/super-admin/restaurants",
    label: "Restaurants",
    icon: "Building2",
    keywords: ["tenants", "owners", "stores", "hub"],
  },
  {
    href: "/super-admin/payments",
    label: "Subscription Payments",
    icon: "Receipt",
    keywords: ["transactions", "invoices", "revenue", "subscription"],
  },
  {
    href: "/super-admin/plans",
    label: "Plans",
    icon: "CreditCard",
    keywords: ["pricing", "packages", "subscription", "saas"],
  },
  {
    href: "/super-admin/billing",
    label: "Billing",
    icon: "Receipt",
    keywords: ["invoices", "subscriptions", "renew"],
  },
  {
    href: "/super-admin/analytics",
    label: "Analytics",
    icon: "BarChart3",
    keywords: ["reports", "charts", "metrics", "growth"],
  },
  {
    href: "/super-admin/landing-site",
    label: "Landing Site",
    icon: "Globe",
    keywords: ["cms", "marketing", "homepage", "website"],
  },
  {
    href: "/super-admin/contact-inbox",
    label: "Contact Inbox",
    icon: "Inbox",
    keywords: ["messages", "inquiries", "contact", "email"],
    badgeKey: "contact",
  },
  {
    href: "/super-admin/logs",
    label: "Logs",
    icon: "ClipboardList",
    keywords: ["audit", "activity", "events", "history"],
  },
  {
    href: "/super-admin/support-tickets",
    label: "Support Tickets",
    icon: "LifeBuoy",
    keywords: ["help", "issues", "tickets", "support"],
  },
  {
    href: "/super-admin/settings",
    label: "Settings",
    icon: "Settings",
    keywords: ["config", "platform", "security", "email", "backup"],
  },
];

/** Deep links for common settings areas (not separate sidebar items). */
export const SUPER_ADMIN_SEARCH_EXTRA_PAGES = [
  {
    href: "/super-admin/settings?tab=payment",
    label: "Payment Settings",
    keywords: ["stripe", "razorpay", "gateway", "billing", "tax", "gst"],
  },
  {
    href: "/super-admin/settings?tab=theme",
    label: "Theme Settings",
    keywords: ["branding", "logo", "colors", "dark mode"],
  },
  {
    href: "/super-admin/profile",
    label: "My Profile",
    keywords: ["account", "password", "avatar", "profile"],
  },
];

function haystackForLink(link) {
  return [
    link.label,
    link.href,
    ...(link.keywords ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

/** @param {string} query @param {number} limit */
export function matchSuperAdminNavLinks(query, limit = 4) {
  const q = String(query ?? "").trim().toLowerCase();
  if (q.length < 2) return [];

  const pool = [...SUPER_ADMIN_NAV_LINKS, ...SUPER_ADMIN_SEARCH_EXTRA_PAGES];

  return pool
    .filter((link) => haystackForLink(link).includes(q))
    .slice(0, limit)
    .map((link) => ({
      type: "page",
      id: link.href,
      title: link.label,
      sub: "Go to page",
      href: link.href,
    }));
}
