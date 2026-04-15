"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "rms-session";

const AppContext = createContext(null);

export const ROLES = ["admin", "manager", "waiter", "chef"];

export function roleLabel(role) {
  const map = {
    admin: "Admin",
    manager: "Manager",
    waiter: "Waiter",
    chef: "Chef",
  };
  return map[role] ?? role;
}

export function defaultRedirectForRole(role) {
  if (role === "chef") return "/kitchen";
  if (role === "waiter") return "/pos";
  return "/dashboard";
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next) => {
    if (next) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else sessionStorage.removeItem(STORAGE_KEY);
    setUser(next);
  }, []);

  const login = useCallback(
    (email, role = "admin") => {
      const name = email?.split("@")[0] || "User";
      persist({
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role,
      });
      return defaultRedirectForRole(role);
    },
    [persist]
  );

  const signup = useCallback(
    ({ name, email, role }) => {
      persist({
        email,
        name,
        role,
      });
      return defaultRedirectForRole(role);
    },
    [persist]
  );

  const logout = useCallback(() => persist(null), [persist]);

  const setDemoRole = useCallback(
    (role) => {
      if (!user) return;
      persist({ ...user, role });
    },
    [user, persist]
  );

  const updateProfile = useCallback(
    (patch) => {
      if (!user) return;
      persist({ ...user, ...patch });
    },
    [user, persist]
  );

  const value = useMemo(
    () => ({
      user,
      hydrated,
      login,
      signup,
      logout,
      setDemoRole,
      updateProfile,
    }),
    [user, hydrated, login, signup, logout, setDemoRole, updateProfile]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
