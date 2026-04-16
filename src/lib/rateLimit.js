/**
 * Simple in-memory rate limiter.
 * Works in Next.js API routes (Node.js runtime).
 *
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60_000, max: 5 });
 *   const result = limiter.check(ip);
 *   if (!result.allowed) return 429 response;
 */

const store = new Map(); // ip → { count, resetAt }

/**
 * @param {{ windowMs: number, max: number }} options
 */
export function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return {
    check(key) {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1 };
      }

      if (entry.count >= max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
      }

      entry.count++;
      return { allowed: true, remaining: max - entry.count };
    },
  };
}

const IS_DEV = process.env.NODE_ENV !== "production";

/* Pre-configured limiters — relaxed in dev */
export const loginLimiter  = rateLimit({ windowMs: 15 * 60_000, max: IS_DEV ? 100 : 10 });
export const signupLimiter = rateLimit({ windowMs: 60 * 60_000, max: IS_DEV ? 50  : 5  });
export const resendLimiter = rateLimit({ windowMs: 60 * 60_000, max: IS_DEV ? 20  : 3  });

/** Get client IP from Next.js request */
export function getClientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}
