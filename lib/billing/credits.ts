import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { CreditBalance, CreditTransaction, CreditTransactionType } from "@/types/account";

/**
 * lib/billing/credits.ts
 * ---------------------------------------------------------------------
 * The ledger behind "clients pay for Vapi usage credits, topped up
 * manually via a Payment Request Link (Elevate Pay / PingPong /
 * Payoneer)." No payment processor integration here on purpose — per the
 * stated model, a human (you) sends the link and marks the top-up once
 * paid; this file only records the resulting balance change and exposes
 * it to the admin and client dashboards.
 *
 * Same swappable-store pattern as lib/accounts/store.ts, and the exact
 * same production limitation applies: this JSON-file implementation is
 * local-dev only. A client's real credit balance must live in a real
 * database before this is trusted with real money — see that file's
 * header and docs/DASHBOARD.md.
 * ---------------------------------------------------------------------
 */

export interface CreditLedger {
  getBalance(businessId: string): Promise<CreditBalance>;
  /** amount > 0 adds credit (e.g. manual_topup), amount < 0 deducts (e.g. usage). */
  recordTransaction(
    businessId: string,
    type: CreditTransactionType,
    amount: number,
    note?: string
  ): Promise<CreditBalance>;
  listAllBalances(): Promise<CreditBalance[]>;
}

const DATA_FILE = path.join(process.cwd(), "data", "credits.json");

interface LedgerFile {
  [businessId: string]: CreditTransaction[];
}

function readAll(): LedgerFile {
  if (!fs.existsSync(DATA_FILE)) return {};
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return raw.trim() ? (JSON.parse(raw) as LedgerFile) : {};
  } catch (err) {
    console.error("[credits] failed to read data/credits.json:", err);
    return {};
  }
}

function writeAll(data: LedgerFile): void {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function balanceFrom(businessId: string, transactions: CreditTransaction[]): CreditBalance {
  const sorted = [...transactions].sort((a, b) => a.createdAtISO.localeCompare(b.createdAtISO));
  return {
    businessId,
    balance: sorted.reduce((sum, t) => sum + t.amount, 0),
    transactions: sorted,
  };
}

/**
 * Local-dev implementation of CreditLedger, backed by a single JSON file.
 * Do not use as-is for real client balances — see file header.
 *
 * @example
 * ```ts
 * // Admin manually credits a client after confirming a Payoneer payment:
 * await creditLedger.recordTransaction(businessId, "manual_topup", 500, "Payoneer PR-0142 paid");
 *
 * // Usage deduction after a Vapi call:
 * await creditLedger.recordTransaction(businessId, "usage", -3, "4-minute call");
 * ```
 */
export function createJsonFileCreditLedger(): CreditLedger {
  return {
    async getBalance(businessId) {
      const data = readAll();
      return balanceFrom(businessId, data[businessId] ?? []);
    },
    async recordTransaction(businessId, type, amount, note) {
      const data = readAll();
      const transactions = data[businessId] ?? [];
      const transaction: CreditTransaction = {
        id: crypto.randomUUID(),
        businessId,
        type,
        amount,
        note,
        createdAtISO: new Date().toISOString(),
      };
      data[businessId] = [...transactions, transaction];
      writeAll(data);
      return balanceFrom(businessId, data[businessId]);
    },
    async listAllBalances() {
      const data = readAll();
      return Object.entries(data).map(([businessId, transactions]) =>
        balanceFrom(businessId, transactions)
      );
    },
  };
}

export const creditLedger: CreditLedger = createJsonFileCreditLedger();
