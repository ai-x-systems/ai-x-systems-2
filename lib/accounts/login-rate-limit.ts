/**
 * lib/accounts/login-rate-limit.ts
 * ---------------------------------------------------------------------
 * Same in-memory, best-effort pattern as lib/chat/rate-limit.ts (see that
 * file's header for the Vercel multi-instance limitation — it applies
 * here identically), but a separate bucket map and much stricter
 * thresholds: login attempts need a tighter window than chat messages.
 *
 * Keyed by `${email}:${ip}`, not just IP — this blunts credential
 * stuffing against one specific account without locking out everyone
 * behind a shared IP (office NAT, VPN) who happen to be logging into
 * different accounts.
 * ---------------------------------------------------------------------
 */

const WINDOW_MS = 5 * 60_000; // 5 minutes
const WINDOW_MAX = 5; // failed or successful attempts per key per window

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function loginKey(email: string, ip: string): string {
  return `${email.trim().toLowerCase()}:${ip}`;
}

/** Call before attempting a login. Does not record an attempt by itself — see recordLoginAttempt. */
export function isLoginRateLimited(email: string, ip: string): boolean {
  const bucket = buckets.get(loginKey(email, ip));
  if (!bucket) return false;
  if (Date.now() - bucket.windowStart > WINDOW_MS) return false;
  return bucket.count >= WINDOW_MAX;
}

/** Call after every login attempt, success or failure, to count it toward the window. */
export function recordLoginAttempt(email: string, ip: string): void {
  const key = loginKey(email, ip);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return;
  }

  bucket.count += 1;
}
