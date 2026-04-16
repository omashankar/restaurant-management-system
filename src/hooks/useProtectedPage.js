"use client";

import { useUser } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * useProtectedPage — redirect if not authenticated or wrong role.
 *
 * Usage in any page:
 *   const { user, loading } = useProtectedPage(["admin", "manager"]);
 *
 * @param {string[]} [roles] — allowed roles (omit = any logged-in user)
 */
export function useProtectedPage(roles) {
  const { user, hydrated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace("/login"); return; }
    if (roles?.length && !roles.includes(user.role)) {
      router.replace(`/unauthorized?role=${user.role}&path=${window.location.pathname}`);
    }
  }, [hydrated, user, roles, router]);

  return useUser();
}
