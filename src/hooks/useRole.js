"use client";

import { useApp } from "@/context/AppProviders";

/** @typedef {'admin'|'manager'|'waiter'|'chef'} Role */

/**
 * Returns the current user's role and convenience boolean flags.
 */
export function useRole() {
  const { user } = useApp();
  const role = /** @type {Role} */ (user?.role ?? "waiter");

  return {
    role,
    isAdmin: role === "admin",
    isManager: role === "manager",
    isWaiter: role === "waiter",
    isChef: role === "chef",
    /** True for roles that can see financial data */
    canViewFinancials: role === "admin" || role === "manager",
    /** True for roles that can manage staff / settings */
    canManageStaff: role === "admin",
    /** True for roles that operate the floor */
    isFloorStaff: role === "waiter" || role === "chef",
  };
}
