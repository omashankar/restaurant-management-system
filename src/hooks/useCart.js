"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * Customer cart state.
 * Each line: { id, name, price, image, itemType, prepTime, qty }
 */
export function useCart() {
  const [lines, setLines] = useState([]);

  const addItem = useCallback((item) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === item.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, image: item.image ?? null, itemType: item.itemType ?? null, prepTime: item.prepTime ?? null, qty: 1 }];
    });
  }, []);

  const removeItem = useCallback((id) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id, qty) => {
    const q = Math.max(1, parseInt(qty, 10) || 1);
    setLines((prev) => prev.map((l) => l.id === id ? { ...l, qty: q } : l));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.price * l.qty, 0), [lines]);
  const itemCount = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);
  const maxPrepTime = useMemo(() => Math.max(0, ...lines.map((l) => l.prepTime ?? 0)), [lines]);

  return { lines, addItem, removeItem, setQty, clearCart, subtotal, itemCount, maxPrepTime };
}
