"use client";

import { useModuleData } from "@/context/ModuleDataContext";
import { useMemo, useState } from "react";

/**
 * Searches existing customers by name or phone.
 * Also provides helpers to add a new customer and select one.
 */
export function useCustomerSearch() {
  const { customerRows, setCustomerRows } = useModuleData();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null); // Customer | null

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customerRows.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
    );
  }, [customerRows, query]);

  /** Add a brand-new customer and auto-select them */
  const addCustomer = ({ name, phone, email = "" }) => {
    const newCustomer = {
      id: `cu-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      visits: 0,
      lastVisit: new Date().toISOString().slice(0, 10),
      notes: "",
      orderHistory: [],
    };
    setCustomerRows((prev) => [...prev, newCustomer]);
    setSelected(newCustomer);
    setQuery("");
    return newCustomer;
  };

  const clearSelection = () => {
    setSelected(null);
    setQuery("");
  };

  return {
    query, setQuery,
    results,
    selected, setSelected,
    addCustomer,
    clearSelection,
  };
}
