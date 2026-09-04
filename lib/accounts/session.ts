import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import { accountStore } from "@/lib/accounts/store";
import { hashPassword, verifyPassword } from "@/lib/accounts/password";
import { Account, AccountRole, toPublicAccount, AccountPublic } from "@/types/account";

/**
 * lib/accounts/session.ts
 * ---------------------------------------------------------------------
 * Deliberately not NextAuth/Clerk/Supabase Auth — those are the right
 * long-term answer (Supabase Auth is already the stated stack), but
 * adopting one is an infrastructure decision (project, env vars, OAuth
 * app registration) that needs your account, not something to silently
 * decide here. This is a minimal, real, working stand-in with the same
 * shape any of those would have (signUp/logIn/logOut/getSession), so
 * swapping later means replacing this file's internals, not rewriting
 * every route or page that calls it.
 *
 * Session format: a signed cookie, not a database-backed session table —
 * "<accountId>.<hmac>" where hmac = HMAC-SHA256(accountId, SESSION_SECRET).
 * Stateless and tamper-evident (an attacker without SESSION_SECRET cannot
 * forge a valid cookie for an arbitrary accountId), but NOT revocable —
 * there's no server-side session list to invalidate, so "log out
 * everywhere" or "ban this account immediately" isn't possible with this
 * implementation alone. Fine for getting sign-in working; revisit if
 * either of those becomes a real requirement.
 *
 * Requires a SESSION_SECRET env var — a long random string, e.g.
 * `openssl rand -hex 32`. Fails loudly (throws) if missing, rather than
 * silently signing with a weak/predictable fallback.
 * ---------------------------------------------------------------------
 */

const COOKIE_NAME = "aixs_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Generate one (e.g. `openssl rand -hex 32`) and set it as an env var before using sign-in."
    );
  }
  return secret;
}

function sign(accountId: string): string {
  const hmac = crypto.createHmac("sha256", getSecret()).update(accountId).digest("hex");
  return `${accountId}.${hmac}`;
}

function verify(token: string): string | null {
  const [accountId, hmac] = token.split(".");
  if (!accountId || !hmac) return null;

  const expected = crypto.createHmac("sha256", getSecret()).update(accountId).digest("hex");
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return accountId;
}

export interface AuthResult {
  success: boolean;
  account?: AccountPublic;
  error?: string;
}

/** Creates a new account and immediately starts a session for it. */
export async function signUp(input: {
  email: string;
  password: string;
  role: AccountRole;
  businessId?: string;
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }
  if (input.password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const existing = await accountStore.findByEmail(email);
  if (existing) {
    return { success: false, error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(input.password);
  const account = await accountStore.create({
    email,
    passwordHash,
    role: input.role,
    businessId: input.businessId,
  });

  await startSession(account);
  return { success: true, account: toPublicAccount(account) };
}

/** Verifies credentials and starts a session on success. */
export async function logIn(email: string, password: string): Promise<AuthResult> {
  const account = await accountStore.findByEmail(email.trim().toLowerCase());
  if (!account) {
    return { success: false, error: "Incorrect email or password." };
  }

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) {
    return { success: false, error: "Incorrect email or password." };
  }

  await startSession(account);
  return { success: true, account: toPublicAccount(account) };
}

async function startSession(account: Account): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(account.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function logOut(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Reads and verifies the session cookie for the current request, if any. */
export async function getSession(): Promise<AccountPublic | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const accountId = verify(token);
  if (!accountId) return null;

  const account = await accountStore.findById(accountId);
  if (!account) return null;

  return toPublicAccount(account);
}
