import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Account, AccountRole } from "@/types/account";

/**
 * lib/accounts/store.ts
 * ---------------------------------------------------------------------
 * Same seam pattern as lib/chat/conversation.ts's ConversationStore: one
 * interface, swap the implementation, no caller changes.
 *
 * ⚠️ PRODUCTION LIMITATION — READ BEFORE DEPLOYING SIGN-UP/SIGN-IN LIVE:
 * createJsonFileAccountStore() writes to data/accounts.json on local disk.
 * That works for local development only. On Vercel (or any serverless
 * platform) the filesystem is read-only outside /tmp, and /tmp itself is
 * not durable across deployments or even across separate function
 * instances — accounts created this way WILL be lost. Do not point real
 * client sign-up at this implementation once it's deployed.
 *
 * To go live: write a new AccountStore implementation backed by Supabase
 * (already the stated stack for auth/DB — see project memory) or another
 * real database, and use it in place of createJsonFileAccountStore()'s
 * return value wherever it's constructed (currently only in
 * lib/accounts/session.ts's helpers). No API route or dashboard page
 * needs to change.
 * ---------------------------------------------------------------------
 */

export interface AccountStore {
  findByEmail(email: string): Promise<Account | undefined>;
  findById(id: string): Promise<Account | undefined>;
  create(input: {
    email: string;
    passwordHash: string;
    role: AccountRole;
    businessId?: string;
  }): Promise<Account>;
  list(): Promise<Account[]>;
}

const DATA_FILE = path.join(process.cwd(), "data", "accounts.json");

function readAll(): Account[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return raw.trim() ? (JSON.parse(raw) as Account[]) : [];
  } catch (err) {
    console.error("[accounts] failed to read data/accounts.json:", err);
    return [];
  }
}

function writeAll(accounts: Account[]): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(accounts, null, 2), "utf-8");
}

/**
 * Local-dev implementation of AccountStore, backed by a single JSON file.
 * See the file header for why this must not be used as-is in production.
 *
 * @example
 * ```ts
 * const store = createJsonFileAccountStore();
 * const account = await store.create({ email, passwordHash, role: "client", businessId });
 * ```
 */
export function createJsonFileAccountStore(): AccountStore {
  return {
    async findByEmail(email) {
      return readAll().find((a) => a.email.toLowerCase() === email.toLowerCase());
    },
    async findById(id) {
      return readAll().find((a) => a.id === id);
    },
    async create({ email, passwordHash, role, businessId }) {
      const accounts = readAll();
      if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }
      const account: Account = {
        id: crypto.randomUUID(),
        email,
        passwordHash,
        role,
        businessId,
        createdAtISO: new Date().toISOString(),
      };
      accounts.push(account);
      writeAll(accounts);
      return account;
    },
    async list() {
      return readAll();
    },
  };
}

// Single shared instance for this server process — mirrors how
// lib/config/load-businesses.ts caches in module scope.
export const accountStore: AccountStore = createJsonFileAccountStore();
