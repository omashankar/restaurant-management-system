/**
 * Maps internal order.status values to customer-facing labels + emoji.
 */

export function normalizeCustomerOrderStatus(raw) {
  const s = String(raw ?? "").toLowerCase().trim();

  if (["cancelled", "canceled", "refunded"].includes(s)) {
    return {
      key: "cancelled",
      label: "Cancelled",
      emoji: "❌",
      chipClass: "bg-red-500/15 text-red-700 ring-red-500/25",
    };
  }
  if (["completed", "done", "served", "delivered", "paid"].includes(s)) {
    return {
      key: "completed",
      label: "Completed",
      emoji: "✅",
      chipClass: "bg-zinc-500/15 text-zinc-800 ring-zinc-400/30",
    };
  }
  if (["ready"].includes(s)) {
    return {
      key: "ready",
      label: "Ready",
      emoji: "🟢",
      chipClass: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30",
    };
  }
  if (["preparing", "cooking", "in_kitchen", "in-kitchen", "processing", "in_progress", "in-progress", "kitchen"].includes(s)) {
    return {
      key: "preparing",
      label: "Preparing",
      emoji: "🔵",
      chipClass: "bg-sky-500/15 text-sky-800 ring-sky-500/30",
    };
  }
  // new, pending, confirmed, etc.
  return {
    key: "pending",
    label: "Pending",
    emoji: "🟡",
    chipClass: "bg-amber-500/15 text-amber-800 ring-amber-500/30",
  };
}

/** Timeline steps for detail page — marks current + completed based on status key */
export function buildOrderTimeline(statusKey) {
  const steps = [
    { key: "pending", title: "Pending", emoji: "🟡" },
    { key: "preparing", title: "Preparing", emoji: "🔵" },
    { key: "ready", title: "Ready", emoji: "🟢" },
    { key: "completed", title: "Completed", emoji: "✅" },
  ];

  if (statusKey === "completed") {
    return steps.map((step) => ({ ...step, state: "done" }));
  }

  if (statusKey === "cancelled") {
    return steps.map((step, i) => ({
      ...step,
      state: i === 0 ? "bad" : "skipped",
    }));
  }

  const order = ["pending", "preparing", "ready", "completed"];
  const effectiveIdx = Math.max(0, order.indexOf(statusKey));

  return steps.map((step, i) => {
    let state = "upcoming";
    if (i < effectiveIdx) state = "done";
    else if (i === effectiveIdx) state = "current";
    return { ...step, state };
  });
}
