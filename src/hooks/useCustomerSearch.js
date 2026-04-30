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

  /** Add a brand-new customer from API and auto-select them */
  const addCustomer = async ({ name, phone, email = "" }) => {
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: "",
    };
    if (!payload.name || !payload.phone) return null;

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.id) return null;

      const newCustomer = {
        id: data.id,
        ...payload,
        visits: 0,
        lastVisit: null,
        orderHistory: [],
      };
      setCustomerRows((prev) => [...prev, newCustomer]);
      setSelected(newCustomer);
      setQuery("");
      return newCustomer;
    } catch {
      return null;
    }
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
