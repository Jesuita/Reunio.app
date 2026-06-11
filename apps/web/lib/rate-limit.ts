/**
 * Simple in-process rate limiter using a sliding window.
 * Works per serverless instance — good for basic abuse protection.
 * For production at scale, swap the store for Upstash Redis.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Cleanup stale entries every 5 minutes to prevent memory leak
let lastCleanup = Date.now();
function maybeCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export type RateLimitOptions = {
  /** Max requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSec: number;
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  maybeCleanup();
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;

  let entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;
  return {
    success:   entry.count <= opts.limit,
    remaining: Math.max(0, opts.limit - entry.count),
    resetAt:   entry.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}
