"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingSections from "@/components/landing/LandingSections";
import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
/*
"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingSections from "@/components/landing/LandingSections";
import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingSections from "@/components/landing/LandingSections";
import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingSections from "@/components/landing/LandingSections";
import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
/*
"use client";

import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingSections from "@/components/landing/LandingSections";
import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar />
      <LandingSections />
      <LandingFooter />
    </main>
  );
}
*/
/*
"use client";

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import {
  BarChart3,
  ChefHat,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CreditCard,
  LayoutGrid,
  MonitorSmartphone,
  Menu,
  Package,
  PackageSearch,
  Star,
  Table2,
  Users,
  UserRoundCheck,
  X,
  CalendarClock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const NAV_LINKS = ["Features", "Pricing", "Demo", "Contact"];

const FEATURES = [
  {
    title: "POS System",
    desc: "Handle dine-in, takeaway, and delivery from one fast billing screen.",
    Icon: CreditCard,
  },
  {
    title: "Menu Management",
    desc: "Create, edit, and organize menu items, categories, and recipes.",
    Icon: LayoutGrid,
  },
  {
    title: "Inventory Tracking",
    desc: "Track ingredient levels and receive low-stock and out-of-stock alerts.",
    Icon: PackageSearch,
  },
  {
    title: "Table Management",
    desc: "Manage table availability, occupancy, and service flow in real time.",
    Icon: Table2,
  },
  {
    title: "Reservations",
    desc: "Accept and track reservations with easy schedule visibility.",
    Icon: CalendarClock,
  },
  {
    title: "Staff Management",
    desc: "Assign roles and streamline operations for every staff member.",
    Icon: Users,
  },
  {
    title: "Customer Management",
    desc: "Store customer details, order history, and personalized service notes.",
    Icon: UserRoundCheck,
  },
  {
    title: "Analytics & Reports",
    desc: "Monitor sales, orders, and trends with clean visual reports.",
    Icon: ChartNoAxesCombined,
  },
];

const MODULE_SHOWCASE = [
  { title: "Dashboard", desc: "KPI widgets, alerts, and business overview.", Icon: BarChart3 },
  { title: "POS", desc: "Fast order capture with category tabs and cart flow.", Icon: CreditCard },
  { title: "Menu", desc: "Manage item cards, categories, and recipe views.", Icon: LayoutGrid },
  { title: "Inventory", desc: "Stock levels with status badges and history.", Icon: Package },
  { title: "Reservations", desc: "Booking timeline with quick status actions.", Icon: ClipboardList },
];

const ROLES = [
  {
    role: "Admin",
    desc: "Full control over settings, modules, users, and configuration.",
    Icon: CheckCircle2,
  },
  {
    role: "Manager",
    desc: "Operations control for orders, staff, inventory, and reporting.",
    Icon: Users,
  },
  {
    role: "Waiter",
    desc: "Quick order handling, table service, and checkout assistance.",
    Icon: ClipboardList,
  },
  {
    role: "Chef",
    desc: "Kitchen-focused queue view for preparing and tracking active orders.",
    Icon: ChefHat,
  },
];

const TESTIMONIALS = [
  {
    name: "Ananya Sharma",
    role: "Owner, Olive Table",
    quote:
      "RMS reduced billing time and gave us a clean daily overview. The team adopted it in just two days.",
  },
  {
    name: "Rahul Mehta",
    role: "Operations Manager, Spice Yard",
    quote:
      "The POS and inventory sync has been a game changer. We finally stopped stock surprises during rush hours.",
  },
  {
    name: "Nina D'Souza",
    role: "Founder, Bake District",
    quote:
      "It feels like an enterprise dashboard but simple enough for every outlet manager to use.",
  },
];

function SectionTitle({ eyebrow, title, subtext }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-sm text-slate-600 md:text-base">{subtext}</p>
    </div>
  );
}

export default function Home() {
  const { user, hydrated } = useApp();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  const plans = useMemo(() => {
    const factor = yearly ? 0.8 : 1;
    const suffix = yearly ? "/yr" : "/mo";
    return [
      {
        name: "Basic",
        price: `$${Math.round(29 * factor)}`,
        note: `per outlet ${suffix}`,
        features: ["POS + Billing", "Menu Management", "Email Support"],
      },
      {
        name: "Pro",
        price: `$${Math.round(79 * factor)}`,
        note: `per outlet ${suffix}`,
        featured: true,
        features: [
          "Everything in Basic",
          "Inventory + Staff",
          "Reservations + Reports",
        ],
      },
      {
        name: "Enterprise",
        price: "Custom",
        note: "multi-location",
        features: ["White-label options", "Priority support", "Custom onboarding"],
      },
    ];
  }, [yearly]);

  if (!hydrated || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-sm text-zinc-500">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="cursor-pointer inline-flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              RMS
            </span>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              Restaurant OS
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="cursor-pointer text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-white"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 p-2 text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {menuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <div className="grid gap-2">
              {NAV_LINKS.map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {label}
                </a>
              ))}
              <Link href="/login" className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Login</Link>
              <Link href="/signup" className="cursor-pointer rounded-lg bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white">Get Started</Link>
            </div>
          </div>
        ) : null}
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pt-20">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Star className="size-3.5" />
            Built for modern restaurants
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Smart Restaurant Management System
          </h1>
          <p className="max-w-xl text-base text-slate-600">
            Manage orders, inventory, staff, and customers — all in one platform
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/signup" className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500">
              Get Started
            </Link>
            <a href="#demo" className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
              Live Demo <ChevronRight className="size-4" />
            </a>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-indigo-100 via-white to-indigo-50 blur-2xl" />
          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-2xl shadow-indigo-100 backdrop-blur-xl">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Today Sales</p>
                <p className="mt-2 text-2xl font-semibold">$12,480</p>
                <p className="mt-2 text-xs text-emerald-600">+18.4% vs yesterday</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Orders Live</p>
                <p className="mt-2 text-2xl font-semibold">126</p>
                <p className="mt-2 text-xs text-indigo-600">32 in kitchen queue</p>
              </div>
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">POS Stream</p>
                <div className="mt-3 space-y-2">
                  {["Table 3 · Pasta x2", "Delivery · Burger Combo", "Takeaway · Iced Latte"].map((line) => (
                    <div key={line} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span>{line}</span>
                      <span className="text-xs text-slate-500">Just now</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-8">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-6 px-4 sm:px-6 lg:px-8">
          {["Urban Spoon", "Blue Fork", "TasteHub", "Mango Tree", "KitchenCraft"].map((brand) => (
            <span key={brand} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-500">
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Features"
          title="Everything your restaurant needs in one platform"
          subtext="From POS to analytics, RMS combines daily operations with decision-ready insights."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ title, desc, Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="How It Works"
            title="Simple rollout for fast-moving teams"
            subtext="From setup to performance tracking, RMS keeps restaurant operations structured."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", title: "Setup Restaurant", text: "Configure business settings, tax, and team roles in minutes." },
              { n: "02", title: "Manage Menu & Tables", text: "Keep your catalog and table layout synced for smooth service." },
              { n: "03", title: "Take Orders via POS", text: "Capture dine-in, takeaway, and delivery orders with speed." },
              { n: "04", title: "Track Inventory & Reports", text: "Monitor stock movement and sales trends from one dashboard." },
            ].map((step) => (
              <article key={step.n} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold tracking-[0.2em] text-indigo-600">{step.n}</p>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Module Showcase"
          title="Explore every RMS module"
          subtext="Built-in modules cover the full restaurant workflow from front-of-house to reporting."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {MODULE_SHOWCASE.map(({ title, desc, Icon }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-600">{desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Role-Based Access"
            title="Built for every role in your restaurant"
            subtext="Give each team member the exact tools they need without clutter."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ role, desc, Icon }) => (
              <article key={role} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 text-base font-semibold">{role}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Dashboard Preview"
          title="A control center for operations and growth"
          subtext="Monitor performance, track orders, and catch inventory risks before they become issues."
        />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Sales Graph</p>
            <div className="mt-4 h-40 rounded-xl bg-gradient-to-t from-indigo-600/25 to-indigo-100" />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Orders List</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="rounded-lg bg-slate-50 px-3 py-2">#1043 · Table 6 · Ready</li>
              <li className="rounded-lg bg-slate-50 px-3 py-2">#1044 · Delivery · In Prep</li>
              <li className="rounded-lg bg-slate-50 px-3 py-2">#1045 · Takeaway · Packed</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold">Inventory Alerts</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-700">Olive Oil: low stock</div>
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">Tomatoes: out of stock</div>
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">Coffee Beans: replenished</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              <MonitorSmartphone className="size-3.5" /> Responsive UI
            </span>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Works on all devices</h3>
            <p className="mt-2 text-sm text-slate-600">
              Mobile-first layout with adaptive modules for desktop, tablet, and phone screens.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-20 rounded-xl border border-slate-200 bg-slate-50" />
              <div className="h-20 rounded-xl border border-slate-200 bg-slate-100" />
              <div className="h-20 rounded-xl border border-slate-200 bg-slate-50" />
            </div>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Star className="size-3.5" /> Benefits
            </span>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">Built to save time daily</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {["Save Time", "Increase Efficiency", "Reduce Errors", "Easy to Use"].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section id="pricing" className="bg-white py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Pricing"
            title="Flexible plans for every restaurant size"
            subtext="Choose monthly or yearly pricing and scale as you grow."
          />
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setYearly((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              aria-pressed={yearly}
            >
              <span className={yearly ? "text-slate-400" : "text-slate-900"}>Monthly</span>
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs text-white">{yearly ? "Yearly" : "Monthly"}</span>
              <span className={yearly ? "text-slate-900" : "text-slate-400"}>Yearly</span>
            </button>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  plan.featured
                    ? "border-indigo-500 bg-indigo-50 shadow-indigo-200/50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="mt-3 text-3xl font-semibold">{plan.price}</p>
                <p className="text-sm text-slate-600">{plan.note}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {plan.features.map((f) => (
                    <li key={f} className="inline-flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" /> {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className={`mt-6 w-full rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    plan.featured
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  Choose {plan.name}
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <SectionTitle
          eyebrow="Testimonials"
          title="Loved by growing restaurant teams"
          subtext="Built to handle real service pressure with a UI teams enjoy working in."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <article key={t.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-700">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-500 p-8 text-white shadow-xl shadow-indigo-500/30 md:flex md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold tracking-tight">Start Managing Your Restaurant Today</h3>
            <p className="mt-2 text-sm text-indigo-100">
              Launch your modern restaurant operations stack in minutes.
            </p>
          </div>
          <Link href="/signup" className="cursor-pointer mt-5 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 md:mt-0">
            Get Started
          </Link>
        </div>
      </section>

      <footer id="contact" className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} RMS. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#features" className="cursor-pointer hover:text-slate-900">Features</a>
            <a href="#demo" className="cursor-pointer hover:text-slate-900">Demo</a>
            <a href="#contact" className="cursor-pointer hover:text-slate-900">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
*/
