/**
 * Simple in-memory rate limiter.
 * Works in Next.js API routes (Node.js runtime).
 *
 * Usage:
 *   const limiter = rateLimit({ windowMs: 60_000, max: 5 });
 *   const result = limiter.check(ip);
 *   if (!result.allowed) return 429 response;
 */

const store = new Map(); // fallback in-memory store
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redisCommand(args) {
  const res = await fetch(`${UPSTASH_REDIS_REST_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("RATE_LIMIT_REDIS_FAILED");
  return res.json();
}

function hasRedisConfig() {
  return Boolean(UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN);
}

/**
 * @param {{ windowMs: number, max: number }} options
 */
export function rateLimit({ windowMs = 60_000, max = 10 } = {}) {
  return {
    async check(key) {
      if (hasRedisConfig()) {
        try {
          const redisKey = `rl:${key}`;
          const ttlSeconds = Math.ceil(windowMs / 1000);
          const commands = [
            ["INCR", redisKey],
            ["PTTL", redisKey],
            ["EXPIRE", redisKey, ttlSeconds, "NX"],
          ];
          const [incrRes, pttlRes] = await redisCommand(commands);
          const count = Number(incrRes?.result ?? 0);
          const ttlMs = Math.max(Number(pttlRes?.result ?? 0), 0);

          if (count > max) {
            return { allowed: false, retryAfter: Math.max(1, Math.ceil(ttlMs / 1000)) };
          }
          return { allowed: true, remaining: Math.max(0, max - count) };
        } catch {
          // Fall back to in-memory limiter when Redis is unavailable.
        }
      }

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
