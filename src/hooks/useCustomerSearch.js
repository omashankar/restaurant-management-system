"use client";

import { useModuleData } from "@/context/ModuleDataContext";
import { extractIndianMobileDigits } from "@/lib/phoneUtils";
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
    const qDigits = extractIndianMobileDigits(q);
    return customerRows.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneDigits = extractIndianMobileDigits(c.phone);
      const phoneMatch =
        qDigits.length >= 3 &&
        (phoneDigits.includes(qDigits) || qDigits.includes(phoneDigits));
      const rawPhoneMatch = c.phone?.replace(/\s/g, "").includes(q.replace(/\s/g, ""));
      return nameMatch || phoneMatch || rawPhoneMatch;
    });
  }, [customerRows, query]);

  /** Add a brand-new customer from API and auto-select them */
  const addCustomer = async ({ name, phone, email = "" }) => {
    const payload = {
      name: String(name ?? "").trim(),
      phone: extractIndianMobileDigits(phone),
      email: String(email ?? "").trim(),
      notes: "",
    };

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.id) {
        return { ok: false, error: data.error ?? "Could not add customer." };
      }

      const newCustomer = {
        id: data.id,
        name: payload.name,
        phone: payload.phone,
        email: payload.email,
        notes: "",
        visits: 0,
        lastVisit: null,
        orderHistory: [],
      };
      setCustomerRows((prev) => [...prev, newCustomer]);
      setSelected(newCustomer);
      setQuery("");
      return { ok: true, customer: newCustomer };
    } catch {
      return { ok: false, error: "Network error. Try again." };
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
