"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import { useEffect } from "react";

/**
 * Global customer-side state:
 * - cart
 * - orderType (dine-in | takeaway | delivery)
 * - customer details (name, phone, address, tableNumber)
 * - toast notifications
 */

const CustomerContext = createContext(null);

export function CustomerProvider({ children }) {
  const cart = useCart();

  const [orderType, setOrderType] = useState(null);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "", address: "", tableNumber: "" });
  const [toasts, setToasts] = useState([]);
  const [orderTypeModalOpen, setOrderTypeModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const updateCustomer = useCallback((patch) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const refreshAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/customer/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data?.success) {
        setAuthUser(data.user);
      } else {
        setAuthUser(null);
      }
    } catch {
      setAuthUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logoutCustomer = useCallback(async () => {
    await fetch("/api/customer/auth/logout", { method: "POST" }).catch(() => null);
    setAuthUser(null);
    setCustomer({ name: "", phone: "", email: "", address: "", tableNumber: "" });
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  /** Prefill checkout fields from profile when user logs in (only fills empty slots). */
  useEffect(() => {
    if (authLoading || !authUser) return;
    setCustomer((prev) => {
      const next = { ...prev };
      if (!String(prev.name ?? "").trim() && authUser.name) next.name = authUser.name;
      if (!String(prev.phone ?? "").trim() && authUser.phone) next.phone = authUser.phone;
      if (!String(prev.email ?? "").trim() && authUser.email) next.email = authUser.email;
      return next;
    });
  }, [authUser, authLoading]);

  const value = useMemo(() => ({
    cart,
    orderType, setOrderType,
    customer, updateCustomer,
    toasts,   showToast,
    orderTypeModalOpen, setOrderTypeModalOpen,
    cartOpen, setCartOpen,
    authUser,
    authLoading,
    refreshAuth,
    logoutCustomer,
  }), [cart, orderType, customer, updateCustomer, toasts, showToast, orderTypeModalOpen, cartOpen, authUser, authLoading, refreshAuth, logoutCustomer]);

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be inside CustomerProvider");
  return ctx;
}
