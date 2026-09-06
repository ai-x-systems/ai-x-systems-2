import "server-only";
import crypto from "crypto";
import { getSupabaseClient } from "@/lib/supabase/client";

/**
 * lib/accounts/reset-token-store.ts
 * ---------------------------------------------------------------------
 * The raw token that goes in the emailed link is never stored — only its
 * SHA-256 hash. A leaked `password_reset_tokens` row is useless to an
 * attacker without the original random value, same reasoning as never
 * storing plaintext passwords.
 *
 * Tokens are single-use (used_at) and short-lived (1 hour) — expired or
 * already-used tokens are treated as invalid on lookup rather than
 * deleted, so there's an audit trail of reset attempts.
 * ---------------------------------------------------------------------
 */

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export interface CreatedResetToken {
  rawToken: string;
  expiresAtISO: string;
}

/** Generates a new reset token for an account and stores only its hash. */
export async function createResetToken(accountId: string): Promise<CreatedResetToken> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("password_reset_tokens").insert({
    account_id: accountId,
    token_hash: hashToken(rawToken),
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw error;

  return { rawToken, expiresAtISO: expiresAt.toISOString() };
}

/**
 * Validates a raw token from a reset link: must exist, be unexpired, and
 * unused. Returns the associated accountId, or null if invalid for any
 * reason (expired, already used, or never existed) — callers should treat
 * all of those identically to avoid leaking which case applies.
 */
export async function findValidResetToken(rawToken: string): Promise<{ accountId: string } | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("account_id, expires_at, used_at")
    .eq("token_hash", hashToken(rawToken))
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.used_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  return { accountId: data.account_id };
}

/** Marks a token used so it can't be replayed, even before it would have expired. */
export async function markResetTokenUsed(rawToken: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("token_hash", hashToken(rawToken));
  if (error) throw error;
}
