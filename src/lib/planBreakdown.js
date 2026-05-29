/**
 * Merge Mongo $group rows so null/missing plan and explicit "free" don't duplicate.
 */
export function normalizePlanBreakdown(raw, { defaultPlan = "free" } = {}) {
  if (!Array.isArray(raw)) return [];

  const counts = new Map();

  for (const row of raw) {
    const rawId = row._id ?? row.plan;
    const plan =
      rawId === null || rawId === undefined || String(rawId).trim() === ""
        ? defaultPlan
        : String(rawId).trim().toLowerCase();
    const count = Number(row.count ?? 0);
    counts.set(plan, (counts.get(plan) ?? 0) + count);
  }

  return Array.from(counts.entries())
    .map(([plan, count]) => ({ plan, count }))
    .sort((a, b) => b.count - a.count);
}
