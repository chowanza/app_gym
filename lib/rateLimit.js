// Simple in-memory fixed-window rate limiter (per-process)
// NOTE: Suitable for single-instance deployments/dev. For multi-instance, use Redis/Upstash.

const buckets = new Map(); // key -> { count, resetAt }

function nowMs() {
  return Date.now();
}

export function rateLimit({ key, limit = 10, windowMs = 60_000 }) {
  const ts = nowMs();
  const entry = buckets.get(key);
  if (!entry || ts >= entry.resetAt) {
    const resetAt = ts + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (entry.count < limit) {
    entry.count += 1;
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
  }
  const retryAfter = Math.ceil((entry.resetAt - ts) / 1000);
  return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter };
}

export function formatRetryAfterSeconds(resetAt) {
  const seconds = Math.max(0, Math.ceil((resetAt - nowMs()) / 1000));
  return seconds;
}
