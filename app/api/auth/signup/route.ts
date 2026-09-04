import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/accounts/session";
import { getBusinessById } from "@/config/businesses";

export const runtime = "nodejs";

/**
 * Client-facing sign-up only — always creates a "client" account, never
 * "admin". Admin accounts are created out-of-band (directly via
 * accountStore, e.g. a one-off script), never through a public route.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; businessId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const { email, password, businessId } = body;
  if (!email || !password || !businessId) {
    return NextResponse.json(
      { success: false, error: "email, password, and businessId are all required." },
      { status: 400 }
    );
  }

  if (!getBusinessById(businessId)) {
    return NextResponse.json(
      { success: false, error: "Unknown businessId — no matching business configuration." },
      { status: 400 }
    );
  }

  const result = await signUp({ email, password, role: "client", businessId });
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
