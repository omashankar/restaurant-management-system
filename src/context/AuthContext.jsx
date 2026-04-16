"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * AuthContext — global user state backed by JWT cookie.
 *
 * Fetches user from /api/auth/me on mount (uses httpOnly cookie).
 * Falls back to localStorage for instant hydration (no flash).
 *
 * Exposes:
 *   user        — { id, name, email, role, restaurantId } | null
 *   loading     — true while /api/auth/me is in-flight
 *   hydrated    — true once initial check is done
 *   setUser     — manually update user (after login/signup)
 *   clearUser   — remove user (logout)
 */

const LS_KEY = "rms-auth-user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState]  = useState(null);
  const [loading, setLoading] = useState(true);   // fetching /me
  const [hydrated, setHydrated] = useState(false); // initial load done

  /* ── 1. Instant hydration from localStorage (no flash) ── */
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LS_KEY);
      if (cached) setUserState(JSON.parse(cached));
    } catch {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  /* ── 2. Verify with server via JWT cookie ── */
  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.user) {
          const u = data.user;
          setUserState(u);
          localStorage.setItem(LS_KEY, JSON.stringify(u));
        } else {
          // Cookie invalid / expired — clear local state
          setUserState(null);
          localStorage.removeItem(LS_KEY);
        }
      })
      .catch(() => {
        // Network error — keep cached user (offline support)
        if (!cancelled) {
          const cached = localStorage.getItem(LS_KEY);
          if (!cached) setUserState(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setHydrated(true);
        }
      });

    return () => { cancelled = true; };
  }, []);

  /* ── Helpers ── */
  const setUser = useCallback((u) => {
    setUserState(u);
    if (u) localStorage.setItem(LS_KEY, JSON.stringify(u));
    else   localStorage.removeItem(LS_KEY);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
    localStorage.removeItem(LS_KEY);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    hydrated,
    setUser,
    clearUser,
  }), [user, loading, hydrated, setUser, clearUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useUser() — access auth state anywhere in the app.
 *
 * @returns {{ user, loading, hydrated, setUser, clearUser }}
 */
export function useUser() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useUser must be used inside AuthProvider");
  return ctx;
}
