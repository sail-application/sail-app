/**
 * lib/utils/rate-limit.ts
 *
 * In-memory sliding-window rate limiter for API routes.
 *
 * Usage:
 *   const limiter = rateLimit({ limit: 10, windowMs: 60_000 });
 *   const result  = limiter('user-123');
 *   if (!result.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 *
 * How it works:
 *   Each identifier stores an array of request timestamps.  On every call
 *   we discard timestamps older than `windowMs`, then check whether the
 *   remaining count exceeds `limit`.  This gives a true sliding window
 *   instead of the fixed-window reset behaviour.
 *
 * Limitations:
 *   - State is per-process — it resets on redeploy and is not shared across
 *     Vercel serverless instances.  For production-grade limiting, layer a
 *     Redis-backed solution (e.g. Upstash) on top.
 *   - A periodic cleanup runs every 60 s to prevent unbounded memory growth
 *     from abandoned identifiers.
 */

/** Options passed when creating a rate limiter instance */
interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number;
  /** Duration of the sliding window in milliseconds */
  windowMs: number;
}

/** Result returned for each rate-limit check */
interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean;
  /** How many requests remain before hitting the limit */
  remaining: number;
  /** Unix-ms timestamp when the earliest tracked request will expire */
  reset: number;
}

/**
 * Create a sliding-window rate limiter.
 *
 * Returns a function you call with a unique identifier (e.g. IP address or
 * user ID).  The function tells you whether the request is allowed and how
 * many requests remain.
 */
export function rateLimit(options: RateLimitOptions) {
  const { limit, windowMs } = options;

  /** Map from identifier → array of request timestamps (newest last) */
  const store = new Map<string, number[]>();

  /** Periodic cleanup so abandoned keys don't leak memory forever */
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const valid = timestamps.filter((t) => t > now - windowMs);
      if (valid.length === 0) {
        store.delete(key);
      } else {
        store.set(key, valid);
      }
    }
  }, 60_000);

  /* Allow Node to exit without waiting for the cleanup timer */
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  /** Check (and record) a request for the given identifier */
  return function check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;

    /* Get existing timestamps and discard anything outside the window */
    const timestamps = (store.get(identifier) ?? []).filter(
      (t) => t > windowStart
    );

    /* Determine whether the request fits within the limit */
    const success = timestamps.length < limit;

    if (success) {
      timestamps.push(now);
    }

    store.set(identifier, timestamps);

    /* Reset = when the oldest tracked timestamp will expire */
    const reset =
      timestamps.length > 0 ? timestamps[0] + windowMs : now + windowMs;

    return {
      success,
      remaining: Math.max(0, limit - timestamps.length),
      reset,
    };
  };
}
