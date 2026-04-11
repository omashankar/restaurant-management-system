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
