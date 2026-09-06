import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/accounts/reset";
import { AccountRole } from "@/types/account";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.email || (body.role !== "admin" && body.role !== "client")) {
    return NextResponse.json(
      { success: false, error: "email and a valid role are required." },
      { status: 400 }
    );
  }

  const result = await requestPasswordReset(body.email, body.role as AccountRole);
  return NextResponse.json(result);
}
