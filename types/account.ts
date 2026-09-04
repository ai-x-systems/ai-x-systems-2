/**
 * types/account.ts
 * ---------------------------------------------------------------------
 * Data model for "who can log in and what can they see" — separate from
 * BusinessConfig (lib/config/business-schema.ts), which is the AI's
 * knowledge/behavior config, not an auth/billing record. One Account maps
 * to one businessId (the client), but the two are intentionally different
 * files/concerns: swapping a client's knowledge base should never require
 * touching their login or credit balance, and vice versa.
 * ---------------------------------------------------------------------
 */

export type AccountRole = "client" | "admin";

export interface Account {
  id: string;
  email: string;
  /** scrypt hash, see lib/accounts/password.ts — never a plaintext password. */
  passwordHash: string;
  role: AccountRole;
  /** Which BusinessConfig (data/businesses/<businessId>.json) this account belongs to. Empty for admin-only accounts. */
  businessId?: string;
  createdAtISO: string;
}

/** Public-safe view of an Account — never includes passwordHash. */
export type AccountPublic = Omit<Account, "passwordHash">;

export function toPublicAccount(account: Account): AccountPublic {
  const { passwordHash: _passwordHash, ...rest } = account;
  return rest;
}

// ---------------------------------------------------------------------------
// Credit ledger
// ---------------------------------------------------------------------------

export type CreditTransactionType =
  | "manual_topup" // admin credited the account after a manual payment
  | "usage" // deducted for Vapi/voice or chat usage
  | "adjustment"; // manual correction (refund, goodwill credit, correction)

export interface CreditTransaction {
  id: string;
  businessId: string;
  type: CreditTransactionType;
  /** Positive for credits added, negative for credits consumed/removed. */
  amount: number;
  /** Free-text — e.g. "Payoneer payment request PR-0142 paid", "Vapi call usage — September". */
  note?: string;
  createdAtISO: string;
}

export interface CreditBalance {
  businessId: string;
  balance: number;
  transactions: CreditTransaction[];
}
