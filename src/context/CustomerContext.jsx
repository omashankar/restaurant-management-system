"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useCart } from "@/hooks/useCart";

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

  const updateCustomer = useCallback((patch) => {
    setCustomer((prev) => ({ ...prev, ...patch }));
  }, []);

  const showToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  const value = useMemo(() => ({
    cart,
    orderType, setOrderType,
    customer, updateCustomer,
    toasts,   showToast,
    orderTypeModalOpen, setOrderTypeModalOpen,
    cartOpen, setCartOpen,
  }), [cart, orderType, customer, updateCustomer, toasts, showToast, orderTypeModalOpen, cartOpen]);

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

export function useCustomer() {
  const ctx = useContext(CustomerContext);
  if (!ctx) throw new Error("useCustomer must be inside CustomerProvider");
  return ctx;
}
