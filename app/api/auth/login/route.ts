import { NextRequest, NextResponse } from "next/server";
import { logIn } from "@/lib/accounts/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json(
      { success: false, error: "email and password are required." },
      { status: 400 }
    );
  }

  const result = await logIn(body.email, body.password);
  return NextResponse.json(result, { status: result.success ? 200 : 401 });
}
