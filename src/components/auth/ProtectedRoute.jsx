"use client";

import { defaultRedirectForRole } from "@/context/AppProviders";
import { useUser } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * ProtectedRoute — client-side auth + RBAC guard.
 *
 * Usage:
 *   <ProtectedRoute>                          // any logged-in user
 *   <ProtectedRoute roles={["admin"]}>        // admin only
 *   <ProtectedRoute roles={["admin","manager"]} fallback={<Custom />}>
 *
 * Props:
 *   roles    — allowed roles (omit = any authenticated user)
 *   fallback — custom loading UI
 *   children
 */
export default function ProtectedRoute({ roles, fallback, children }) {
  const { user, loading, hydrated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    /* Not logged in → login */
    if (!user) {
      router.replace("/login");
      return;
    }

    /* Role not allowed → unauthorized */
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      router.replace(
        `/unauthorized?role=${user.role}&path=${window.location.pathname}`
      );
    }
  }, [hydrated, user, roles, router]);

  /* Loading state */
  if (loading || !hydrated) {
    return fallback ?? (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  /* Not authenticated */
  if (!user) return null;

  /* Role check failed */
  if (roles && roles.length > 0 && !roles.includes(user.role)) return null;

  return children;
}
