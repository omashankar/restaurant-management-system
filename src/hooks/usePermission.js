"use client";

import { useApp } from "@/context/AppProviders";
import { ROLE_PERMISSIONS } from "@/config/rolePermissions";
import { useMemo } from "react";

/**
 * Returns a `hasPermission` checker and the full permission set
 * for the currently logged-in user's role.
 *
 * Usage:
 *   const { hasPermission } = usePermission();
 *   if (hasPermission("view_sales")) { ... }
 */
export function usePermission() {
  const { user } = useApp();
  const role = user?.role ?? "waiter";

  const permissions = useMemo(
    () => new Set(ROLE_PERMISSIONS[role] ?? []),
    [role]
  );

  /**
   * @param {import("@/config/rolePermissions").Permission} permission
   * @returns {boolean}
   */
  const hasPermission = (permission) => permissions.has(permission);

  /**
   * Returns true only if the user has ALL listed permissions.
   * @param {import("@/config/rolePermissions").Permission[]} list
   */
  const hasAll = (list) => list.every((p) => permissions.has(p));

  /**
   * Returns true if the user has ANY of the listed permissions.
   * @param {import("@/config/rolePermissions").Permission[]} list
   */
  const hasAny = (list) => list.some((p) => permissions.has(p));

  return { hasPermission, hasAll, hasAny, permissions, role };
}
