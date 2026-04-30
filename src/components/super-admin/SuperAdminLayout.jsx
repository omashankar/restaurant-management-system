"use client";

import SuperAdminSidebar from "./SuperAdminSidebar";
import { useUser } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Shield } from "lucide-react";

export default function SuperAdminLayout({ children }) {
  const { user, hydrated, loading } = useUser();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role !== "super_admin") { router.replace("/unauthorized"); }
  }, [hydrated, user, router]);

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
    </div>
  );
}
