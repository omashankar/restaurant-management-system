"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { useUser } from "./AuthContext";

const AppContext = createContext(null);

export const ROLES = ["admin", "manager", "waiter", "chef"];

export function roleLabel(role) {
  const map = { admin: "Admin", manager: "Manager", waiter: "Waiter", chef: "Chef" };
  return map[role] ?? role;
}

export function defaultRedirectForRole(role) {
  switch (role) {
    case "super_admin": return "/super-admin/dashboard";
    case "admin":       return "/admin/dashboard";
    case "manager":     return "/manager/dashboard";
    case "waiter":      return "/waiter/dashboard";
    case "chef":        return "/chef/dashboard";
    default:            return "/dashboard";
  }
}

export function AppProvider({ children }) {
  const { user, loading, hydrated, setUser, clearUser } = useUser();

  /* ── Login — call after API login success ── */
  const login = useCallback(
    (email, role = "admin", name) => {
      const displayName = name
        ?? email?.split("@")[0]?.replace(/[._]/g, " ") ?? "User";
      const u = {
        email,
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        role,
      };
      setUser(u);
      return defaultRedirectForRole(role);
    },
    [setUser]
  );

  /* ── Signup — call after API signup success ── */
  const signup = useCallback(
    ({ name, email, role }) => {
      setUser({ name, email, role });
      return defaultRedirectForRole(role);
    },
    [setUser]
  );

  /* ── Logout — clear user + cookie ── */
  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    clearUser();
  }, [clearUser]);

  const setDemoRole = useCallback(
    (role) => { if (user) setUser({ ...user, role }); },
    [user, setUser]
  );

  const updateProfile = useCallback(
    (patch) => { if (user) setUser({ ...user, ...patch }); },
    [user, setUser]
  );

  const value = useMemo(
    () => ({ user, hydrated, loading, login, signup, logout, setDemoRole, updateProfile }),
    [user, hydrated, loading, login, signup, logout, setDemoRole, updateProfile]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
