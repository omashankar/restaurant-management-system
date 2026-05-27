"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";
import {
  getCustomerStorageScope,
  migrateLegacyCustomerSession,
  readStoredCustomerDraft,
  readStoredOrderType,
  writeStoredCustomerDraft,
  writeStoredOrderType,
} from "@/lib/customerSessionStorage";
import { usePathname } from "next/navigation";

/**
 * Global customer-side state (sessionStorage per restaurant):
 * - cart, orderType, checkout customer draft
 * - pendingCartItem — in-memory only until order type chosen
 */

const CustomerContext = createContext(null);

const EMPTY_CUSTOMER = { name: "", phone: "", email: "", address: "", tableNumber: "" };

export function CustomerProvider({ children }) {
  const pathname = usePathname();
  const storageScope = useMemo(() => getCustomerStorageScope(pathname), [pathname]);
  const cart = useCart(storageScope);

  const [orderType, setOrderTypeState] = useState(null);
  const [pendingCartItem, setPendingCartItem] = useState(null);
  const [customer, setCustomer] = useState(EMPTY_CUSTOMER);
  const [sessionReady, setSessionReady] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [orderTypeModalOpen, setOrderTypeModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /** Load order type + checkout draft when restaurant scope changes. */
  useEffect(() => {
    setSessionReady(false);
    migrateLegacyCustomerSession(storageScope);
    const storedType = readStoredOrderType(storageScope);
    setOrderTypeState(storedType);
    const draft = readStoredCustomerDraft(storageScope);
    setCustomer(draft ? { ...EMPTY_CUSTOMER, ...draft } : { ...EMPTY_CUSTOMER });
    setPendingCartItem(null);
    setOrderTypeModalOpen(false);
    setSessionReady(true);
  }, [storageScope]);

  /** Persist checkout draft (name, phone, address, etc.). */
  useEffect(() => {
    if (!sessionReady) return;
    writeStoredCustomerDraft(storageScope, customer);
  }, [customer, storageScope, sessionReady]);

  const setOrderType = useCallback(
    (type) => {
      setOrderTypeState(type);
      writeStoredOrderType(storageScope, type);
    },
    [storageScope]
  );

  const updateCustomer = useCallback((patch) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const tryAddToCart = useCallback(
    (item) => {
      if (!item?.id) return;
      if (orderType) {
        cart.addItem(item);
        showToast(`${item.name} added to cart`);
        setCartOpen(true);
        return;
      }
      setPendingCartItem(item);
      setOrderTypeModalOpen(true);
    },
    [orderType, cart, showToast]
  );

  const completeOrderTypeChoice = useCallback(
    (type) => {
      setOrderType(type);
      setOrderTypeModalOpen(false);
      const pending = pendingCartItem;
      setPendingCartItem(null);
      if (pending) {
        cart.addItem(pending);
        showToast(`${pending.name} added to cart`);
        setCartOpen(true);
      }
      return Boolean(pending);
    },
    [pendingCartItem, cart, setOrderType, showToast]
  );

  const closeOrderTypeModal = useCallback(() => {
    setOrderTypeModalOpen(false);
    if (pendingCartItem) {
      setPendingCartItem(null);
      showToast("Select an order type to add items to your cart.", "error");
    }
  }, [pendingCartItem, showToast]);

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
    setCustomer({ ...EMPTY_CUSTOMER });
    writeStoredCustomerDraft(storageScope, EMPTY_CUSTOMER);
  }, [storageScope]);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  /** Prefill checkout fields from profile when user logs in (only fills empty slots). */
  useEffect(() => {
    if (authLoading || !authUser || !sessionReady) return;
    setCustomer((prev) => {
      const next = { ...prev };
      if (!String(prev.name ?? "").trim() && authUser.name) next.name = authUser.name;
      if (!String(prev.phone ?? "").trim() && authUser.phone) next.phone = authUser.phone;
      if (!String(prev.email ?? "").trim() && authUser.email) next.email = authUser.email;
      return next;
    });
  }, [authUser, authLoading, sessionReady]);

  const value = useMemo(
    () => ({
      cart,
      orderType,
      setOrderType,
      storageScope,
      pendingCartItem,
      tryAddToCart,
      completeOrderTypeChoice,
      closeOrderTypeModal,
      customer,
      updateCustomer,
      toasts,
      showToast,
      orderTypeModalOpen,
      setOrderTypeModalOpen,
      cartOpen,
      setCartOpen,
      authUser,
      authLoading,
      refreshAuth,
      logoutCustomer,
    }),
    [
      cart,
      orderType,
      setOrderType,
      storageScope,
      pendingCartItem,
      tryAddToCart,
      completeOrderTypeChoice,
      closeOrderTypeModal,
      customer,
      updateCustomer,
      toasts,
      showToast,
      orderTypeModalOpen,
      cartOpen,
      authUser,
      authLoading,
      refreshAuth,
      logoutCustomer,
    ]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be inside CustomerProvider");
  return ctx;
}
