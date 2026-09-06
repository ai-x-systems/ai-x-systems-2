import { NextRequest, NextResponse } from "next/server";
import { completePasswordReset } from "@/lib/accounts/reset";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { token?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.token || !body.newPassword) {
    return NextResponse.json(
      { success: false, error: "token and newPassword are required." },
      { status: 400 }
    );
  }

  const result = await completePasswordReset(body.token, body.newPassword);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
