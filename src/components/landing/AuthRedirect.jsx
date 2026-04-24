"use client";

/**
 * AuthRedirect — client component that handles the logged-in user redirect.
 * Extracted from page.jsx so the root page can be a server component.
 * Renders nothing — only performs the redirect side-effect.
 */

import { defaultRedirectForRole, useApp } from "@/context/AppProviders";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRedirect() {
  const { user, hydrated } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace(defaultRedirectForRole(user.role));
  }, [hydrated, user, router]);

  return null; // renders nothing — side-effect only
}
