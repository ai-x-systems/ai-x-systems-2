import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/accounts/session";
import { creditLedger } from "@/lib/billing/credits";
import { CreditTransactionType } from "@/types/account";

export const runtime = "nodejs";

const ALLOWED_TYPES: CreditTransactionType[] = ["manual_topup", "usage", "adjustment"];

/**
 * The manual-billing action itself: you send a Payment Request Link
 * (Elevate Pay / PingPong / Payoneer) directly to the client outside this
 * app, and once it's paid, call this to record the top-up here — this
 * route never talks to a payment processor, on purpose, per the stated
 * "manual link per client" model.
 *
 * @example POST body: { "type": "manual_topup", "amount": 500, "note": "Payoneer PR-0142 paid" }
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ businessId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required." }, { status: 403 });
  }

  const { businessId } = await context.params;

  let body: { type?: string; amount?: number; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.type || !ALLOWED_TYPES.includes(body.type as CreditTransactionType)) {
    return NextResponse.json(
      { success: false, error: `type must be one of: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (typeof body.amount !== "number" || body.amount === 0 || Number.isNaN(body.amount)) {
    return NextResponse.json(
      { success: false, error: "amount must be a non-zero number." },
      { status: 400 }
    );
  }

  const balance = await creditLedger.recordTransaction(
    businessId,
    body.type as CreditTransactionType,
    body.amount,
    body.note
  );

  return NextResponse.json({ success: true, balance });
}
