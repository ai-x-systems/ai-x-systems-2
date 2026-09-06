import { NextRequest, NextResponse } from "next/server";
import { logOut } from "@/lib/accounts/session";
import { AccountRole } from "@/types/account";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let role: AccountRole | undefined;
  try {
    const body = await req.json();
    if (body?.role === "admin" || body?.role === "client") role = body.role;
  } catch {
    // No body / not JSON — fall back to clearing both, same as before.
  }

  await logOut(role);
  return NextResponse.json({ success: true });
}
