/**
 * Find existing customer by phone or create via API.
 * Used for delivery orders so cashier only fills delivery form once.
 */
export async function resolveCustomerByPhone({ name, phone, customerRows, setCustomerRows }) {
  const trimmedName = name?.trim() ?? "";
  const trimmedPhone = phone?.trim() ?? "";
  if (!trimmedName || !trimmedPhone) return null;

  const norm = (p) => p.replace(/\D/g, "").slice(-10);
  const target = norm(trimmedPhone);

  const existing = customerRows.find((c) => norm(c.phone ?? "") === target);
  if (existing) return existing;

  try {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        phone: trimmedPhone,
        email: "",
        notes: "POS delivery",
      }),
    });
    const data = await res.json();

    if (res.ok && data?.id) {
      const created = {
        id: data.id,
        name: trimmedName,
        phone: trimmedPhone,
        email: "",
        notes: "POS delivery",
        visits: 0,
        lastVisit: null,
        orderHistory: [],
      };
      setCustomerRows?.((prev) => [...prev, created]);
      return created;
    }

    if (res.status === 409) {
      const searchRes = await fetch(`/api/customers?q=${encodeURIComponent(trimmedPhone)}`);
      const searchData = await searchRes.json();
      if (searchData.success && Array.isArray(searchData.customers) && searchData.customers.length > 0) {
        const found = searchData.customers[0];
        const normalized = {
          id: found.id,
          name: found.name ?? trimmedName,
          phone: found.phone ?? trimmedPhone,
          email: found.email ?? "",
          notes: found.notes ?? "",
          visits: Number(found.visits ?? 0),
          lastVisit: found.lastVisit ?? null,
          orderHistory: found.orderHistory ?? [],
        };
        setCustomerRows?.((prev) => {
          if (prev.some((c) => c.id === normalized.id)) return prev;
          return [...prev, normalized];
        });
        return normalized;
      }
    }
  } catch {
    /* fall through */
  }

  return { id: null, name: trimmedName, phone: trimmedPhone, ephemeral: true };
}
