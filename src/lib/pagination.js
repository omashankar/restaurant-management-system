/**
 * Shared pagination helpers for API routes and client fetchers.
 */

export function parsePageParam(raw, fallback = 1) {
  const n = parseInt(String(raw ?? fallback), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parseLimitParam(raw, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const n = parseInt(String(raw ?? defaultLimit), 10);
  if (!Number.isFinite(n) || n < 1) return defaultLimit;
  return Math.min(maxLimit, Math.max(1, n));
}

/** Skip offset before total count is known (do not clamp page to pages yet). */
export function paginationSkip(page, limit) {
  const safePage = parsePageParam(page);
  const safeLimit = Math.max(1, limit);
  return (safePage - 1) * safeLimit;
}

export function buildPaginationMeta({ page, limit, total }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), pages);
  return {
    page: safePage,
    limit,
    total,
    pages,
    skip: (safePage - 1) * limit,
  };
}
